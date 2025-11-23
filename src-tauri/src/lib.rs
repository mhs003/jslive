use tauri::command;
use std::process::{Command, Stdio};
use std::io::Write;


#[command]
fn run_njs(code: String) -> String {
    let mut child = Command::new("node")
        .arg("-")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to run node");

    {
        let stdin = child.stdin.as_mut().unwrap();
        stdin.write_all(code.as_bytes()).unwrap();
    }

    let output = child.wait_with_output().unwrap();

    let mut result = String::new();
    result.push_str(&String::from_utf8_lossy(&output.stdout));
    result.push_str(&String::from_utf8_lossy(&output.stderr));

    result
}

#[command]
fn run_php(code: String) -> String {
    let mut child = Command::new("php")
        .arg("-r")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .arg(code)
        .spawn()
        .expect("failed to run php");

    let output = child.wait_with_output().unwrap();

    let mut result = String::new();
    result.push_str(&String::from_utf8_lossy(&output.stdout));
    result.push_str(&String::from_utf8_lossy(&output.stderr));

    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_php, run_njs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
