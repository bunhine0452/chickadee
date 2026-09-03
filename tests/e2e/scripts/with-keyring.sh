#!/usr/bin/env bash
# tests/e2e/scripts/with-keyring.sh <command...>
#
#   E8 의 「모의 키체인」 (06 §1.5 · §3.5).
#
#   리눅스 CI 러너에는 Secret Service 가 없다 — `keyring` 크레이트의 `sync-secret-service`
#   백엔드는 D-Bus 위의 `org.freedesktop.secrets` 를 찾고, 없으면 저장 자체가 실패한다.
#   그래서 세션 버스 하나와 gnome-keyring 을 세우고, **그것이 정말 도는지 왕복으로 확인한
#   뒤에만** `CHICKADEE_E2E_KEYRING=1` 을 물려 준다.
#
#   확인에 실패하면 0 을 물려 준다. 그때 E8 은 「키가 저장된다」가 아니라 **「저장이 실패하고
#   앱이 그것을 저장됐다고 말하지 않는다」**를 확인한다 — 없는 것을 통과시키지 않는다.
#
#   쓰는 법: xvfb 안쪽에서 이것이 나머지를 감싼다.
#     xvfb-run -a bash tests/e2e/scripts/with-keyring.sh pnpm test:e2e
set -uo pipefail

export LC_ALL=${LC_ALL:-C.UTF-8}

# 두 번째 진입(이미 dbus-run-session 안). 여기서 데몬을 세우고 확인한다.
if [ "${1:-}" = "--inner" ]; then
  shift
  export CHICKADEE_E2E_KEYRING=0

  if command -v gnome-keyring-daemon >/dev/null 2>&1; then
    # 빈 비밀번호로 기본 키링을 만들고 연다. `--unlock` 은 비밀번호를 stdin 으로 받는다.
    printf '\n' | gnome-keyring-daemon --unlock --components=secrets >/dev/null 2>&1 || true
    eval "$(printf '\n' | gnome-keyring-daemon --start --components=secrets 2>/dev/null)" || true
    export GNOME_KEYRING_CONTROL SSH_AUTH_SOCK
  fi

  # **왕복으로 확인한다.** 데몬이 떴다는 것만으로는 `org.freedesktop.secrets` 가 붙었다는
  # 뜻이 아니다 (컴포넌트가 안 올라오면 조용히 없다).
  if command -v secret-tool >/dev/null 2>&1; then
    if printf 'probe' | secret-tool store --label=chickadee-e2e-probe app chickadee-e2e >/dev/null 2>&1 \
      && [ "$(secret-tool lookup app chickadee-e2e 2>/dev/null)" = "probe" ]; then
      secret-tool clear app chickadee-e2e >/dev/null 2>&1 || true
      export CHICKADEE_E2E_KEYRING=1
    fi
  fi

  if [ "$CHICKADEE_E2E_KEYRING" = "1" ]; then
    echo "with-keyring: Secret Service 확인됨 — E8 은 저장·삭제 왕복을 검사한다"
  else
    echo "with-keyring: Secret Service 없음 — E8 은 「저장 불가」 경로를 검사한다 (06 §3.5)"
  fi
  exec "$@"
fi

if command -v dbus-run-session >/dev/null 2>&1; then
  exec dbus-run-session -- bash "$0" --inner "$@"
fi

echo "with-keyring: dbus-run-session 이 없다 — 세션 버스 없이 그대로 돈다"
export CHICKADEE_E2E_KEYRING=0
exec "$@"
