#!/usr/bin/env bash
# tests/e2e/scripts/first-run-sockets.sh <binary> <out.json> [seconds]
#
#   E1 「첫 실행 … 네트워크 소켓 0(`strace -e trace=network` 카운트)」 (06 §1.5).
#
#   앱을 **드라이버 없이** strace 밑에서 한 번 띄우고, 정해진 시간 뒤 죽이고, 트레이스를
#   세어 JSON 하나로 남긴다. E1 스펙이 그 JSON 을 읽고 판정한다.
#
# 왜 WebDriver 세션 안에서 안 재나
#   tauri-driver 는 WebKitWebDriver 를 띄우고 그것이 앱을 띄운다. 드라이버는 TCP 로 말하고
#   웹뷰의 인스펙터 서버도 포트를 연다 — 그 앱의 소켓을 세면 **언제나 0이 아니다**. 그래서
#   E1 의 소켓 측정만 세션 밖에서 한 번, 같은 격리 트리로 돈다.
#
# 무엇을 세나 — AF_INET/AF_INET6 만
#   유닉스 도메인 소켓(AF_UNIX)은 WebKit 의 프로세스 간 통신·D-Bus·X11 이 정상적으로 쓰고,
#   AF_NETLINK 는 glibc 가 인터페이스 목록을 읽는 데 쓴다. 그 둘을 함께 세면 게이트는
#   언제나 빨갛고, 빨간 게이트는 곧 꺼진 게이트다. 그래서 셋으로 나눈다:
#     external — 루프백이 아닌 주소로의 connect/sendto      → **이것이 0 이어야 한다**
#     dns      — 포트 53 (스텁 리졸버 127.0.0.53 포함)      → 보고. 이름을 찾았다는 뜻이다
#     loopback — 127.0.0.0/8 · ::1 로의 connect             → 보고
#   `external` 만 차단 조건으로 삼는 근거는 06 §3.2 의 선언이 「코드가 이 컴퓨터를 떠나지
#   않는다」이기 때문이다. dns·loopback 은 0 이 기대값이지만 첫 CI 실행 전에는 실측이 없어
#   차단으로 걸지 않는다 — 첫 야간 결과에서 0 임이 확인되면 그때 조인다(그 판단은 사람이).
#
# **빈 트레이스는 통과가 아니다.** 앱이 즉시 죽어도 소켓은 0이 된다. 그래서 `<app_data>/
# chickadee.db` 가 생겼는지를 함께 적고, E1 이 `booted` 를 먼저 본다.
set -uo pipefail

BIN=${1:?사용법: first-run-sockets.sh <binary> <out.json> [seconds]}
OUT=${2:?사용법: first-run-sockets.sh <binary> <out.json> [seconds]}
SECS=${3:-12}

# 한국어가 든 파일을 바이너리로 보지 않게 (m5 인계 「밟으면 터지는 자리」).
export LC_ALL=${LC_ALL:-C.UTF-8}

WORK=$(dirname "$OUT")
mkdir -p "$WORK"
TRACE="$WORK/first-run.strace"
APPLOG="$WORK/first-run.stdout"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/dev.chickadee.app"

fail_json() {
  python3 - "$OUT" "$1" <<'PY'
import json, sys
out, reason = sys.argv[1], sys.argv[2]
json.dump({"schema": 1, "traced": False, "booted": False, "reason": reason,
           "counts": {}, "samples": {}}, open(out, "w"), ensure_ascii=False, indent=2)
print(f"first-run-sockets: {reason}")
PY
  exit 0
}

command -v strace >/dev/null 2>&1 || fail_json "strace 가 없다 — 잡에서 apt-get install strace"
[ -x "$BIN" ] || fail_json "실행 파일이 없다: $(basename "$BIN")"
[ -n "${DISPLAY:-}" ] || fail_json "DISPLAY 가 없다 — xvfb-run 안에서 돌려라"

rm -f "$TRACE" "$APPLOG"
echo "first-run-sockets: ${SECS}s 동안 strace -e trace=network 로 첫 실행을 잰다"

# timeout 이 strace 를 죽이고, strace 는 자기가 띄운 자식을 함께 죽인다. 그래도 남는
# 프로세스가 있으면 뒤에서 한 번 더 정리한다 — 남으면 다음 세션이 같은 DB 를 잡는다.
timeout -k 5 "$SECS" \
  strace -f -qq -s 256 -e trace=network -o "$TRACE" "$BIN" >"$APPLOG" 2>&1
# `-x -f` 로 **명령줄 전체**가 같은 것만 고른다. 이름으로 고르면 이 스크립트 자신의 명령줄
# (`bash .../first-run-sockets.sh .../chickadee-app ...`)에도 그 이름이 있어 스스로를 죽이고,
# 그러면 아래 JSON 이 안 남는다 — E1 은 「측정 결과가 없다」로만 실패한다.
pkill -x -f "$BIN" >/dev/null 2>&1 || true
sleep 1

[ -f "$TRACE" ] || fail_json "트레이스 파일이 안 생겼다 — strace 가 ptrace 권한을 못 얻었을 수 있다"

python3 - "$TRACE" "$OUT" "$SECS" "$DATA_DIR" <<'PY'
import json, os, re, sys

trace, out, secs, data_dir = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]

# `[pid  1234] connect(...)` · `1234  connect(...)` · `connect(...)` 셋 다 벗긴다.
HEAD = re.compile(r'^(?:\[pid\s+\d+\]\s*|\d+\s+)?(?P<name>\w+)\((?P<rest>.*)$')
FAMILY = re.compile(r'sa_family=(AF_\w+)')
PORT = re.compile(r'htons\((\d+)\)')
V4 = re.compile(r'inet_addr\("([^"]+)"\)')
V6 = re.compile(r'inet_pton\(AF_INET6,\s*"([^"]+)"')

counts = {k: 0 for k in
          ("external", "dns", "loopback", "inetSocket", "inetBind", "unix", "netlink", "other")}
samples = {k: [] for k in ("external", "dns", "loopback", "inetSocket", "inetBind")}

def add(bucket, line):
    counts[bucket] += 1
    if len(samples.get(bucket, [])) < 20:
        samples[bucket].append(line.strip()[:240])

def loopback(addr):
    return addr.startswith("127.") or addr in ("::1", "::ffff:127.0.0.1", "0.0.0.0", "::")

with open(trace, "r", errors="replace") as fh:
    for line in fh:
        m = HEAD.match(line)
        if not m:
            continue
        name, rest = m.group("name"), m.group("rest")
        if name == "socket":
            fam = rest.split(",")[0].strip()
        else:
            fm = FAMILY.search(rest)
            fam = fm.group(1) if fm else None
        if fam is None:
            continue
        if fam in ("AF_UNIX", "AF_LOCAL"):
            counts["unix"] += 1
            continue
        if fam == "AF_NETLINK":
            counts["netlink"] += 1
            continue
        if fam not in ("AF_INET", "AF_INET6"):
            counts["other"] += 1
            continue
        # 여기서부터 IP 소켓이다.
        if name == "socket":
            add("inetSocket", line)
            continue
        if name == "bind":
            add("inetBind", line)
            continue
        if name not in ("connect", "sendto", "sendmsg"):
            continue
        pm, am = PORT.search(rest), (V4.search(rest) or V6.search(rest))
        port = int(pm.group(1)) if pm else -1
        addr = am.group(1) if am else ""
        if port == 53:
            add("dns", line)
        elif addr and loopback(addr):
            add("loopback", line)
        else:
            add("external", line)

booted = os.path.isfile(os.path.join(data_dir, "chickadee.db"))
body = {
    "schema": 1,
    "traced": True,
    "seconds": secs,
    "booted": booted,
    # 차단 조건은 external 하나다 — 위 헤더의 「무엇을 세나」 참고.
    "gate": "external",
    "counts": counts,
    "samples": samples,
}
with open(out, "w") as fh:
    json.dump(body, fh, ensure_ascii=False, indent=2)

print("first-run-sockets:", json.dumps(counts, ensure_ascii=False), "booted =", booted)
for line in samples["external"]:
    print("  external:", line)
for line in samples["dns"]:
    print("  dns:", line)
PY
