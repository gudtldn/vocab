// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use crate::types::VocabularyItem;
use std::{
    fs::File,
    io::{BufRead, BufReader, Write},
    path::PathBuf,
};

/// 단어, 요미가나, 뜻1, 뜻2, ...|||메모 형식의 CSV 파일을 파싱하여 단어 목록을 반환합니다.
/// 메모는 |||로 구분됩니다.
#[tauri::command]
pub async fn parse_vocab_file(file_path: PathBuf) -> Result<Vec<VocabularyItem>, String> {
    tokio::task::spawn_blocking(move || {
        let file = File::open(file_path).map_err(|e| e.to_string())?;

        let reader = BufReader::new(file);
        let vocab_list = reader
            .lines()
            .filter_map(|line| line.ok())
            .filter_map(|line| {
                // 먼저 메모 구분자로 분리
                let parts_with_note: Vec<&str> = line.split("|||").collect();
                let main_part = parts_with_note[0];
                let note = if parts_with_note.len() > 1 {
                    let note_str = parts_with_note[1].trim();
                    if note_str.is_empty() {
                        None
                    } else {
                        Some(note_str.to_string())
                    }
                } else {
                    None
                };

                // 메인 부분을 쉼표로 분리
                let parts: Vec<&str> = main_part.split(',').collect();

                if parts.len() >= 2 {
                    let word = parts[0].to_string();
                    let reading = parts[1].to_string();
                    let meanings: Vec<String> = parts[2..]
                        .iter()
                        .map(|s| s.to_string())
                        .filter(|s| !s.is_empty())
                        .collect();

                    Some(VocabularyItem::new(word, reading, meanings, note))
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

/// 파일에 텍스트를 저장합니다.
#[tauri::command]
pub async fn save_text_file(file_path: PathBuf, content: String) -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        let mut file = File::create(&file_path).map_err(|e| format!("파일 생성 실패: {}", e))?;
        file.write_all(content.as_bytes())
            .map_err(|e| format!("파일 쓰기 실패: {}", e))?;
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}
