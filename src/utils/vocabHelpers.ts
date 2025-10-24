import { VocabularyItem } from "../types";
import { shuffleArray } from "../utils";

/**
 * 객관식 문제의 선택지 생성
 * @param correctWord 정답 단어
 * @param allVocabulary 선택지 생성을 위한 전체 어휘 목록
 * @param distractorCount 오답 선택지 개수 (기본 3개)
 * @returns 섞인 선택지 배열
 */
export const generateChoices = (
  correctWord: VocabularyItem,
  allVocabulary: VocabularyItem[],
  distractorCount: number = 3
): string[] => {
  const correctAnswers = correctWord.meanings;
  
  // 모든 의미 추출 및 중복 제거
  const allMeanings = allVocabulary.flatMap(v => v.meanings);
  const uniqueMeanings = [...new Set(allMeanings)];
  
  // 정답이 아닌 것들 중에서 랜덤 선택
  const distractors = uniqueMeanings
    .filter(m => !correctAnswers.includes(m))
    .sort(() => 0.5 - Math.random())
    .slice(0, distractorCount);
  
  // 정답(첫 번째만) + 오답들을 섞어서 반환
  return shuffleArray([
    correctAnswers[0],
    ...distractors,
  ]);
};

/**
 * 어휘 아이템이 중복인지 확인
 */
export const isDuplicateVocab = (
  list: VocabularyItem[],
  item: VocabularyItem
): boolean => {
  return list.some(v => 
    v.word === item.word && v.reading === item.reading
  );
};

/**
 * 중복되지 않은 어휘만 추가
 */
export const addUniqueVocab = (
  list: VocabularyItem[],
  item: VocabularyItem
): VocabularyItem[] => {
  return isDuplicateVocab(list, item) ? list : [...list, item];
};
