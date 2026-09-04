<div align="center">

<img src="design/logo/png/badge-256.png" width="128" alt="Chickadee">

# Chickadee

**Your own code is the textbook.**

A desktop study app for people who shipped an app with AI but cannot read what they shipped.

</div>

## Install

Download the file for your platform from the [Releases page](../../releases), then read the
next two sections before you run it — the build is unsigned, and your operating system will
say so.

| Platform | File |
|---|---|
| macOS · Apple silicon | `Chickadee_0.1.0_aarch64.dmg` |
| macOS · Intel | `Chickadee_0.1.0_x64.dmg` |
| Windows | `Chickadee_0.1.0_x64-setup.exe` |
| Linux · AppImage | `Chickadee_0.1.0_amd64.AppImage` |
| Linux · Debian, Ubuntu | `Chickadee_0.1.0_amd64.deb` |

### The build is not signed

Chickadee has no Apple notarization and no Windows code-signing certificate. That is a
spending decision, not an oversight — $99 a year for a Developer ID plus $200-400 a year
for a Windows certificate, held off until the download count or the "it won't open" reports
are there to justify it. Here is what each system does and what to do about it.

**macOS** — if the "unidentified developer" warning appears, move the app to your
Applications folder and run

```sh
xattr -d com.apple.quarantine /Applications/Chickadee.app
```

or control-click the app in Finder and choose **Open**. Either one is needed only the first
time. The warning is there because the build is not notarized by Apple; check it against
`SHA256SUMS.txt` instead.

**Windows** — on the SmartScreen dialog, choose **More info → Run anyway**. The warning is
there because no code-signing certificate has been bought yet.

**Linux** — `chmod +x` the AppImage before running it. It needs `libwebkit2gtk-4.1`
(`sudo apt install libwebkit2gtk-4.1-0` on Ubuntu 22.04 and later).

### Check what you downloaded

`SHA256SUMS.txt` is attached to every release. While the builds are unsigned it is the only
integrity check there is, so it is worth the ten seconds. Put it next to the file you
downloaded and run:

```sh
# macOS
shasum -a 256 -c --ignore-missing SHA256SUMS.txt

# Linux
sha256sum -c --ignore-missing SHA256SUMS.txt
```

```powershell
# Windows PowerShell — compare the output against the line for your file in SHA256SUMS.txt
Get-FileHash .\Chickadee_0.1.0_x64-setup.exe -Algorithm SHA256
```

### Supported systems

| System | Version | Architecture | Needs |
|---|---|---|---|
| macOS | 12+ | arm64, x64 | — |
| Windows | 10 1809+ | x64 | WebView2 Evergreen |
| Linux | Ubuntu 22.04+ | x64 | webkit2gtk 4.1 |

Anything outside this table may build, but nothing tests it.

### Going back to an earlier version

Releases are immutable: a broken one is not deleted or replaced, it gets a "known issues"
banner and a patch release, and the older files stay on the Releases page. 0.1.0 is the
first release, so there is nothing to go back to yet.

From the next schema change onward: before applying a migration the app copies your
database into `backups/` beside it and keeps the last three. If you then install an older
build, it will not open a database written by a newer one — it stops and shows you the
backup path. To go back, copy the newest `chickadee-v<n>-<timestamp>.db` over
`chickadee.db` in the app data directory.

| System | App data directory |
|---|---|
| macOS | `~/Library/Application Support/dev.chickadee.app/` |
| Windows | `%APPDATA%\dev.chickadee.app\` |
| Linux | `~/.local/share/dev.chickadee.app/` |

## What it is

You vibe-coded an app. It works. You cannot explain a single line of it.

Chickadee reads **your** repository and turns it into study material — not someone else's
tutorial examples. It parses your files with tree-sitter, finds where each language concept
actually appears in your code, and builds cards from those exact lines. Every repository
produces a different curriculum, because every repository is a different set of things
you have not yet understood.

The bet is that reading is recognition, not knowledge. Explanations are something Claude
already gives you. What is missing is **forced active output** — so the app makes you
produce, not read.

### Where it starts you

If the language is new to you, Chickadee starts from the simplest lines in your own repo and
works up. The first session in a language opens a prologue — Chapter 0, the floor of this
language — and it closes after 24 plates.

If programming itself is new, the same prologue carries you. It opens at `if`, defining a
function, `return`, comparison, reassignment and loops, and every one of those is already
sitting in the app you shipped. First run asks once whether programming is new to you; the
answer lives in Settings and you can change it any time. There is no placement test, and no
plate outside Chapter 0 changes because of your answer.

What it still cannot do is start you with no code at all. Your repo is the textbook, so you
need one — vibe-coded is exactly the case this is built for. If you have not shipped anything
yet, [CS50](https://cs50.harvard.edu) is a good place to get the first one.

## Three tracks, none of which run your code

| Track | Problem | Graded by |
|---|---|---|
| **T0 · Syntax** | Meaning, fill-in-the-blank, point-at-it — one line of your code plus context | Multiple choice / pointing |
| **T1 · Clone coding** | Three fading stages: copy it → skeleton only → blank page | Line-level equivalence against the original |
| **T2 · Structure** | Responsibility placement, blast radius, flow tracing, dependency direction | Your real commits as the answer key |

Nothing is executed. That is what makes every language reachable — grading needs a parser
and a diff, not a runtime.

## How it works

```
your repo (read-only)                     grammar dictionary (YAML + tree-sitter queries)
      │                                                  │
      ▼                                                  ▼
┌─ thin Rust ─────────────────────────────────────────────────────────┐
│  git2 · tree-sitter · rusqlite — writes only FACTS to SQLite:       │
│  file · capture · commit · commit_file.  ≤ 2800 lines, CI-enforced. │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─ thick TypeScript ──────────────────────────────────────────────────┐
│  concept sites · cards · FSRS scheduling · grading · the entire UI  │
└─────────────────────────────────────────────────────────────────────┘
```

Rust knows nothing about the domain. It has no word for "card" or "concept" — a CI script
greps for those and fails the build. The reasoning: the people maintaining this are vibe
coders, and Rust is the one language vibe coding does not carry. So every bug is pushed
into TypeScript, where it can actually be fixed.

Mastery accrues **per concept**, not per file — so it survives you rewriting the repo, and
your deck never explodes. Intervals come from FSRS.

## Privacy

**Your code never leaves this computer.** Chickadee only reads your repository, and your
study record is kept in one SQLite file on this machine. No telemetry, no crash upload, no
sync, no usage statistics — not opt-out, absent. The app makes zero network calls; the CSP
is `default-src 'self'`. **Settings → Erase everything** deletes the database, its backups,
the logs, and the stored API key.

The one place code could ever go out is the LLM step of the "I don't know" ladder, and
0.1.0 does not go there. It assembles the prompt — the line you are stuck on plus four
lines on each side, file base name only, never a directory path, repository name, commit
message, or author — and you copy it yourself. Sending from inside the app is planned for
0.2, and it will need an explicit press every time.

## Status

**0.1.0, the first release.** Ingest, the three tracks, and the study session run. Not in
yet: code signing, automatic updates, a grammar dictionary for the five non-TypeScript
parsers that ship with the build, and end-to-end coverage on Windows. `CHANGELOG.md` has
the rest.

## Stack

Tauri 2 · Rust (git2, tree-sitter, rusqlite) · React 19 + Vite 6 · Monaco · SQLite · FSRS.

Design docs live in `docs/` (Korean). The UI ships in Korean.

## License

MIT. Bundled fonts (IBM Plex Sans KR, IBM Plex Mono, Black Han Sans) are SIL OFL 1.1 —
see `apps/desktop/src/assets/fonts/`.
