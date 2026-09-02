/**
 * M0 의 화면 — 토큰만 있는 화면.
 *
 * 여기에 기능은 없다. 있어야 하는 것은 딱 하나: 토큰·리셋·조판 강제·폰트가 실제로 걸려 있어서
 * `check-contrast`·Stylelint 4룰·`__audit` 이 붙을 표면이 생긴다는 것. 화면은 M1 에서 온다.
 */
export function App(): React.JSX.Element {
  return (
    <main className="shell">
      <h1 className="wordmark">Chickadee</h1>
      <p className="note">
        바이브 코딩으로 만든 내 코드가 교재다. 아직 리포를 읽지 않았다.
      </p>
    </main>
  );
}
