use std::io::Write;
use std::process::{Command, Stdio};
use tauri::command;

#[tauri::command]
fn run_njs(code: String) -> Result<String, String> {
    let mut child = Command::new("node")
        .arg("-")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn node: {}", e))?;

    {
        let stdin = child.stdin.as_mut().ok_or("Failed to open stdin")?;
        stdin
            .write_all(code.as_bytes())
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for output: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        // combine stderr and stdout if you want
        let err = format!(
            "{}{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
        Err(err)
    }
}

#[tauri::command]
fn run_php(code: String) -> Result<String, String> {
    let child = Command::new("php")
        .arg("-r")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .arg(&code)
        .spawn()
        .map_err(|e| format!("Failed to run php: {}", e))?;

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for output: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("{}{}", stdout, stderr))
    }
}

#[tauri::command]
fn run_python(code: String) -> Result<String, String> {
    let child = Command::new("python3")
        .arg("-c")
        .arg(&code)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run python: {}", e))?;

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for output: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("{}{}", stdout, stderr))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![run_php, run_njs, run_python])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
