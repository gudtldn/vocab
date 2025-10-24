import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 타이머 훅
 * @param isPaused 타이머를 일시정지할지 여부
 * @returns 경과 시간, 리셋 함수, 현재 시간 가져오기 함수
 */
export const useTimer = (isPaused: boolean = false) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused]);

  const reset = useCallback(() => {
    setElapsedTime(0);
  }, []);

  const getTime = useCallback(() => elapsedTime, [elapsedTime]);

  return { elapsedTime, reset, getTime };
};
