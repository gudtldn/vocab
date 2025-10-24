/**
 * Fisher-Yates 알고리즘을 사용한 배열 섞기
 * Math.random() - 0.5를 사용한 정렬보다 더 균등한 분포를 제공
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * 문자열에서 모든 공백을 제거
 */
export const removeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, "");
};

/**
 * 배열을 안전하게 n개의 랜덤 요소로 샘플링
 */
export const sampleArray = <T>(array: T[], count: number): T[] => {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * 시간을 MM:SS 형식으로 포맷
 * @param seconds 초 단위 시간
 * @returns MM:SS 형식의 문자열
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 두 문자열을 정규화하여 비교 (공백 제거, 소문자 변환, 트림)
 * @param str1 첫 번째 문자열
 * @param str2 두 번째 문자열
 * @returns 정규화된 문자열이 같으면 true
 */
export const normalizeAndCompare = (str1: string, str2: string): boolean => {
  const normalize = (str: string) => 
    removeWhitespace(str.toLowerCase().trim());
  return normalize(str1) === normalize(str2);
};

/**
 * 문자열 배열 중 하나라도 대상 문자열과 일치하는지 확인
 * @param target 대상 문자열
 * @param candidates 후보 문자열 배열
 * @returns 일치하는 것이 있으면 true
 */
export const matchesAny = (target: string, candidates: string[]): boolean => {
  const normalizedTarget = removeWhitespace(target.toLowerCase().trim());
  return candidates.some(candidate => 
    normalizeAndCompare(normalizedTarget, candidate)
  );
};
