mod commands;
mod error;
// The integration test drives the job directly (06 §1.4).
pub mod jobs;
mod state;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                // 5 x 5 MiB 회전 (01 §7). 금지 필드는 호출부가 걸러 넣지 않는다.
                .max_file_size(5 * 1024 * 1024)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .manage(state::AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::store::store_open,
            commands::store::store_query,
            commands::store::store_exec,
            commands::store::store_batch,
            commands::store::store_info,
            commands::app::app_paths,
            commands::app::app_version,
            commands::app::t3_run,
            commands::repo::repo_probe,
            commands::repo::file_read_lines,
            commands::repo::file_read_block,
            commands::repo::git_blame_lines,
            commands::repo::git_diff_text,
            commands::repo::parse_langs,
            commands::repo::parse_snippet,
            commands::repo::app_reveal,
            commands::ingest::ingest_start,
            commands::ingest::ingest_cancel,
            commands::ingest::ingest_status,
        ])
        .setup(|app| {
            // 창은 숨겨진 채 만들어지고 폰트가 준비된 뒤 프런트가 show 를 부른다 (05 §1.2).
            // 프런트가 죽어도 사람이 창을 볼 수 있게 debug 빌드에서는 바로 띄운다.
            if cfg!(debug_assertions) {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("tauri 앱을 시작하지 못했습니다");
}
