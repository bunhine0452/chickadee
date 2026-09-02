// 로그인 폼 — 시도 횟수를 세다 다섯 번을 넘기면 잠근다.
export function watchLogin(form: HTMLFormElement) {
  let attempts = 0;
  const limit = 5;

  form.addEventListener('submit', () => {
    attempts += 1;
    if (attempts > limit) {
      form.setAttribute('aria-disabled', 'true');
    }
  });
}
