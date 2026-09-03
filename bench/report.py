#!/usr/bin/env python3
"""Turn the two benchmark outputs into one report (06 §1.6).

    python3 bench/report.py <baseline.json> <current.json> <ts-bench.json> <out.md> [bench.sh-outcome]

Inputs
  baseline.json / current.json   criterion ingest harness (`scripts/bench.sh`, schema 1)
  ts-bench.json                  `vitest bench --outputJson` (files[].groups[].benchmarks[])
  bench.sh-outcome               "success" or "failure" - `scripts/bench.sh` owns the
                                 +30%-over-baseline rule, and its verdict is blocking too:
                                 a baseline nobody acts on is a baseline nobody updates.

Exit code
  0  every blocking threshold is met
  2  at least one blocking threshold was crossed
  1  an input is missing or malformed

The nightly job turns 2 into an issue; a pull request only ever gets the comment
(06 §1.6: "blocking a PR on a shared runner's noise is how a benchmark gets switched off").

Which statistic: the TS rows compare **mean**, not p99. The blocking limit is already 2x the
target, and a shared runner's p99 swings far more than that headroom - a gate that fires on
noise is a gate people delete. p99 is printed next to it so a real tail regression is visible.
"""
import json
import sys

# 06 §1.6, row by row. `fail` is the blocking limit, `warn` only colours the line.
INGEST_ROWS = [
    # key, label, unit, warn, fail, budget (03 §7)
    ("fullTotalMs", "ingest 100k lines - total", "ms", 22_500, 30_000, 15_000),
    ("peakRssMb", "ingest 100k lines - peak RSS", "MB", 450, 600, 300),
    ("parseMs", "parse (whole run)", "ms", None, None, 8_000),
    ("gitMs", "git walk", "ms", None, None, 4_000),
    ("incrementalMs", "incremental (1 commit, 5 files)", "ms", None, None, 500),
]

# name substring -> (label, target ms, blocking ms)
TS_ROWS = [
    ("gradeT1 · 20", "T1 compare engine - 20 lines", 20.0, 40.0),
    ("gradeT1 · 40", "T1 compare engine - 40 lines", 35.0, 70.0),
    ("planSession · 개념 2000개", "session queue - 2,000 concepts", 50.0, 150.0),
]

# 06 §1.6 asks for a p95 of 12 ms on the home screen. It is reported, never blocking - see
# the "frame_p95" section of the output for why.
FRAME_BUDGET_MS = 12
FRAME_MEASURED_MS = 19  # D105, release build, WebKit, 18 sheets / 391 stickers


def load(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError) as err:
        print(f"report: cannot read {path}: {err}", file=sys.stderr)
        return None


def pct(now, was):
    if not was:
        return "-"
    delta = (now - was) / was * 100
    return f"{delta:+.1f}%"


def ts_benchmarks(report):
    for file_ in report.get("files", []):
        for group in file_.get("groups", []):
            for bench in group.get("benchmarks", []):
                yield bench


def main(argv):
    if len(argv) not in (5, 6):
        print(__doc__)
        return 1
    baseline, current, ts_report, out = (load(argv[1]), load(argv[2]), load(argv[3]), argv[4])
    outcome = argv[5] if len(argv) == 6 else ""
    if current is None or ts_report is None:
        return 1

    lines = ["## Benchmark (06 §1.6)", ""]
    blocking = []

    host = current.get("host", {})
    fixture = current.get("fixture", {})
    lines.append(
        f"host `{host.get('os', '?')}/{host.get('arch', '?')} x{host.get('parallelism', '?')}` · "
        f"fixture `{fixture.get('name', '?')}` "
        f"({fixture.get('files', '?')} files, {fixture.get('commits', '?')} commits)"
    )
    if baseline is not None:
        base_host = baseline.get("host", {})
        if base_host != host:
            lines.append("")
            lines.append(
                f"> Baseline was taken on `{base_host.get('os', '?')}/{base_host.get('arch', '?')}` - "
                "the % column compares across machines, so read it as a hint, not a verdict."
            )
    lines += ["", "| metric | baseline | now | vs baseline | budget | limit | |",
              "|---|---:|---:|---:|---:|---:|---|"]

    metrics = current.get("metrics", {})
    base_metrics = (baseline or {}).get("metrics", {})
    for key, label, unit, warn, fail, budget in INGEST_ROWS:
        now = metrics.get(key)
        if not isinstance(now, (int, float)):
            continue
        was = base_metrics.get(key)
        mark = ""
        if fail is not None and now > fail:
            mark = "**FAIL**"
            blocking.append(f"{label}: {now} {unit} > {fail} {unit}")
        elif warn is not None and now > warn:
            mark = "warn"
        elif budget is not None and now > budget:
            mark = "over 03 §7 budget"
        lines.append(
            f"| {label} | {was if was is not None else '-'} | {now} | "
            f"{pct(now, was) if isinstance(was, (int, float)) else '-'} | "
            f"{budget if budget is not None else '-'} | {fail if fail is not None else '-'} | {mark} |"
        )

    for needle, label, target, limit in TS_ROWS:
        found = next((b for b in ts_benchmarks(ts_report) if needle in b.get("name", "")), None)
        if found is None:
            blocking.append(f"{label}: the benchmark did not run")
            lines.append(f"| {label} | - | did not run | - | {target} | {limit} | **FAIL** |")
            continue
        mean = found.get("mean", 0.0)
        p99 = found.get("p99", 0.0)
        mark = ""
        if mean > limit:
            mark = "**FAIL**"
            blocking.append(f"{label}: {mean:.2f} ms > {limit} ms")
        elif mean > target:
            mark = "over target"
        lines.append(
            f"| {label} | - | {mean:.2f} ms (p99 {p99:.2f}) | - | {target} ms | {limit} ms | {mark} |"
        )

    lines += [
        f"| home render p95 | - | not measured here | - | {FRAME_BUDGET_MS} ms | - | report only |",
        "",
        "### home render p95 - reported, not blocking",
        "",
        f"D105 measured **{FRAME_MEASURED_MS} ms** against a {FRAME_BUDGET_MS} ms budget on a release",
        "build (WebKit, 18 sheets, 391 stickers), and windowing did not move it. Three reasons this",
        "job reports the number instead of failing on it:",
        "",
        "1. 06 §1.6 makes the *Chromium* p95 the blocking one and says WebKit is report-only. The",
        "   19 ms is WebKit. The Chromium measurement lives in the Playwright design-gates job.",
        "2. A metric that is known to be over budget, wired as a nightly failure, is red from the",
        "   first night. 06 §1.6 already refuses that trade for PRs; it is worse for a nightly job",
        "   nobody is watching.",
        "3. The next step is tracked work, not a regression: D105 says replace the inline SVG",
        "   `<use>` stickers, not add virtual scrolling.",
        "",
        "It becomes a gate the day the Chromium measurement runs here.",
        "",
        "### what is *not* measured",
        "",
        "- **Per-file parse p95** (06 §1.6 wants ≤ 20 ms, blocking at 40 ms). The criterion harness",
        "  reports the parse phase of a whole run, not a per-file distribution; a per-file p95 needs",
        "  a new criterion bench in `crates/parse`.",
        "- **T1 with an AST.** `gradeT1` here runs the regex layer only - the AST layer needs",
        "  `parse_snippet`, which is a Rust command and cannot be called from vitest. The numbers are",
        "  a lower bound on the real latency.",
        "- **The T1 gutter (0.2 ms/line).** That is a render cost; `perfRun.ts` measures `t1:monaco`.",
    ]

    if outcome == "failure":
        blocking.append(
            "scripts/bench.sh: a metric is more than 30% over `bench/baseline.json` "
            "(see the step log for which). Updating the baseline is a human's PR (06 §1.6)."
        )

    if blocking:
        lines = lines[:1] + ["", "**Over the blocking threshold:**", ""] \
            + [f"- {item}" for item in blocking] + lines[1:]

    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 2 if blocking else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
