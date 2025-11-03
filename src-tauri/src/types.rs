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

    /// 메모 (선택 사항)
    #[serde(skip_serializing_if = "Option::is_none")]
    note: Option<String>,
}

impl VocabularyItem {
    /// 새로운 VocabularyItem을 생성합니다.
    pub fn new(word: String, reading: String, meanings: Vec<String>, note: Option<String>) -> Self {
        Self {
            word,
            reading,
            meanings,
            note,
        }
    }
}
