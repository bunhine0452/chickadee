//! 크래시 리포트 (06 §8). 패닉 하나를 `<app_data>/logs/crash/<ts>.json` 한 줄로 남긴다.
//!
//! **담지 않는 것**: 사용자 코드·파일 경로·리포 이름 (01 §6 금지 필드). 담는 것은 앱 버전 ·
//! OS · 아키텍처 · 패닉이 난 **앱 소스**의 자리와 메시지뿐이다. 앱 소스 경로는 우리 것이라
//! 금지 필드가 아니고, 그것이 없으면 리포트가 쓸모가 없다.
//!
//! 전송하지 않는다 — 사용자가 「진단 묶음 만들기」로 직접 첨부한다 (06 §8 · §3.2).
use tauri::AppHandle;

pub fn install(app: &AppHandle) {
    let Ok(dir) = crate::commands::maint::data_dir(app) else {
        return;
    };
    let dir = dir.join("logs").join("crash");
    let prev = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        write(&dir, info);
        prev(info);
    }));
}

fn write(dir: &std::path::Path, info: &std::panic::PanicHookInfo<'_>) {
    let at = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(0, |d| d.as_millis());
    // 페이로드는 우리가 쓴 문자열이다. 그래도 200자에서 끊는다 — 파일 내용이 실려 오는
    // 경로(예: 남의 라이브러리가 입력을 담아 패닉하는 것)를 길이로 한 번 더 막는다.
    let payload = info.payload();
    let msg = payload
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| payload.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("");
    let body = serde_json::json!({
        "at": at,
        "appVersion": env!("CARGO_PKG_VERSION"),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "where": info.location().map(|l| format!("{}:{}", l.file(), l.line())),
        "message": msg.chars().take(200).collect::<String>(),
    });
    if std::fs::create_dir_all(dir).is_ok() {
        let _ = std::fs::write(dir.join(format!("{at}.json")), body.to_string());
    }
}
