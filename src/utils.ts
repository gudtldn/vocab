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
