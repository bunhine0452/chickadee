// Windows 릴리스에서 콘솔 창이 같이 뜨는 것을 막는다.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    chickadee_app_lib::run();
}
