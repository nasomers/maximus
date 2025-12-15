// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use lumen_lib::cli;

fn main() {
    // Parse CLI arguments
    let command = cli::parse_args();

    // Execute CLI command
    match cli::execute(command) {
        Ok(true) => {
            // Command was handled, exit without opening GUI
            return;
        }
        Ok(false) => {
            // Open GUI
            lumen_lib::run()
        }
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    }
}
