// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use crate::types::VocabularyItem;
use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::PathBuf,
};

/// 단어, 요미가나, 뜻1, 뜻2, ... 형식의 CSV 파일을 파싱하여 단어 목록을 반환합니다.
#[tauri::command]
pub async fn parse_vocab_file(file_path: PathBuf) -> Result<Vec<VocabularyItem>, String> {
    tokio::task::spawn_blocking(move || {
        let file = File::open(file_path).map_err(|e| e.to_string())?;

        let reader = BufReader::new(file);
        let vocab_list = reader
            .lines()
            .filter_map(|line| line.ok())
            .filter_map(|line| {
                let parts: Vec<&str> = line.split(',').collect();

                if parts.len() >= 2 {
                    Some(VocabularyItem::new(
                        parts[0].to_string(),
                        parts[1].to_string(),
                        parts[2..].iter().map(|s| s.to_string()).collect(),
                    ))
                } else {
                    None
                }
            })
            .collect::<Vec<VocabularyItem>>();

        Ok(vocab_list)
    })
    .await
    .map_err(|e| e.to_string())?
}
