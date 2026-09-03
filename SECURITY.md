# Security policy

## Reporting a vulnerability

Report privately, through
**[GitHub private vulnerability reporting](../../security/advisories/new)**
(Security tab → Report a vulnerability). Only the maintainers can read a report filed there.

**Do not open a public issue for a vulnerability.** Chickadee ships as an unsigned desktop
build that users install by hand (see [Unsigned builds](#unsigned-builds)); a public report
describes an attack against people who cannot receive a fix automatically.

What we do with a report:

| Step | Timing |
|---|---|
| Acknowledgement that the report arrived, and whether we can reproduce it | within 72 hours |
| A fix, or a decision that it is out of scope with the reasoning | in the advisory thread |
| Public disclosure — advisory published, credit given if you want it | after the release that carries the fix |

Include the app version, the OS, and the steps. Do not attach source files from your own
repositories, and do not attach a database or a log until we have asked for one — see
[What not to send](#what-not-to-send).

## Supported versions

| Version | Supported |
|---|---|
| 0.1.x | Yes |
| < 0.1 | No |

Fixes land on the newest release. There are no backport branches while the project is
pre-1.0: if you are on an older 0.x, upgrade.

## Supported platforms

Security fixes are tested on these. Other targets may build, but are unverified.

| OS | Requirement |
|---|---|
| macOS 12+ | arm64 and x64 |
| Windows 10 1809+ | x64, WebView2 Evergreen runtime required |
| Ubuntu 22.04+ | x64, `libwebkit2gtk-4.1` |

## Threat model

The full model is in `docs/06-quality-security-release.md` §4 (Korean). The part that
decides how a report is judged:

**A repository is untrusted input.** Chickadee opens repositories the user cloned from
elsewhere, including files an AI wrote. The parser, the walker and the ingest path treat
every byte in them as hostile:

- File and line size caps (512 KiB per file, 20,000 bytes per line), a 2 s parser timeout,
  and an AST depth cap of 512. A parser bomb has to fail closed, not hang the app.
- Symbolic links are not followed. Paths are canonicalized and rejected unless they stay
  under the repository root — that check covers IPC path arguments too.
- The `git` binary is never invoked. Chickadee reads repositories through libgit2, which
  does not run hooks. A `Command::new("git")` anywhere in the Rust tree fails CI.

**A grammar dictionary is untrusted data too.** Dictionary YAML is community-contributed
and its wording is rendered as HTML. It is validated against a JSON Schema with
`additionalProperties: false`, there is no expression evaluator, and the six allowed tags
(`code b i em br kbd`, zero attributes) are enforced by DOMPurify in a single component.

**The WebView is locked down.** A CSP with no external origin, Tauri capabilities narrowed
to the repository the user picked plus the app data directory, `deny_unknown_fields` on
every IPC input, and Zod validation on every IPC response.

**0.1.x makes no network call at all, and there is no telemetry in any version.** Fonts are
bundled rather than fetched. The LLM step of the "I don't know" ladder assembles its prompt
locally and stops at copy; sending from inside the app is planned for 0.2 and will need a
press every time. The updater plugin is not in the build. A packet leaving the app is a
vulnerability, and is worth reporting even if you cannot show what it carried.

## Unsigned builds

Releases are not code-signed or notarized yet, so macOS shows "unidentified developer" and
Windows shows SmartScreen. The workaround is in the README and in the release notes.

The consequence for security: **verify what you downloaded**. Every release carries
`SHA256SUMS.txt`. Check the file against it before you run the installer. Chickadee has no
auto-updater, so a fix reaches you only when you download the new release yourself.

## What not to send

Chickadee's own rule is that user code never leaves the machine, and a security report is
not an exception. When you file one:

- No source excerpts from a private repository. If a specific input is needed, build the
  smallest synthetic file that reproduces it.
- No `chickadee.db`, no export file, no log or crash JSON from a machine that has real
  work on it. Logs are written not to hold code, paths or repository names, but a database
  does hold captured excerpts.
- No API keys. Keys live in the OS keychain and never appear in a log, a crash report or
  an export — if you find one somewhere else, that itself is the report.
