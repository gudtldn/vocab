use serde::{Deserialize, Serialize};

/// 단어 목록을 저장하는 구조체
#[derive(Debug, Serialize, Deserialize)]
pub struct VocabularyItem {
    /// 단어
    word: String,

    /// 요미가나
    reading: String,

    /// 뜻 목록
    meanings: Vec<String>,
}

impl VocabularyItem {
    /// 새로운 VocabularyItem을 생성합니다.
    pub fn new(word: String, reading: String, meanings: Vec<String>) -> Self {
        Self {
            word,
            reading,
            meanings,
        }
    }
}
