use std::{
    fs::File,
    io::{Write},
    process::{Command, Stdio},
};
use tauri::command;

fn do_exec(interpreter: &str, file_ext: &str, code: &str, args: &[&str]) -> Result<String, String> {
    let mut path = std::env::temp_dir();
    let temp_path = format!("codelive_exec_{}.{}", uuid::Uuid::new_v4(), file_ext);
    path.push(temp_path);

    {
        let mut file = File::create(&path)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;
        file.write_all(code.as_bytes())
            .map_err(|e| format!("Failed to write code: {}", e))?;
    }

    let mut command = Command::new(interpreter);
    for a in args {
        command.arg(a);
    }
    command.arg(&path);
    command.stdin(Stdio::null())
           .stdout(Stdio::piped())
           .stderr(Stdio::piped());

    let output = command
        .spawn()
        .and_then(|c| c.wait_with_output())
        .map_err(|e| format!("Failed to execute {}: {}", interpreter, e))?;

    let _ = std::fs::remove_file(&path);

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(stdout + &stderr)
    }
}

#[command]
fn run_njs(code: String) -> Result<String, String> {
    do_exec("node", "js", &code, &[])
}

#[command]
fn run_bun(code: String) -> Result<String, String> {
    do_exec("bun", "ts", &code, &[])
}

#[command]
fn run_php(code: String) -> Result<String, String> {
    do_exec("php", "php", &code, &[])
}

#[command]
fn run_python(code: String) -> Result<String, String> {
    do_exec("python3", "py", &code, &[])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_njs, run_bun, run_php, run_python])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
