import { useState, useEffect } from "react";
import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

/**
 * Tauri AppData 디렉토리에 JSON 파일로 상태를 저장하는 커스텀 훅
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    const loadValue = async () => {
      try {
        const fileName = `${key}.json`;
        const fileExists = await exists(fileName, {
          baseDir: BaseDirectory.AppData,
        });

        if (fileExists) {
          const data = await readTextFile(fileName, {
            baseDir: BaseDirectory.AppData,
          });
          setStoredValue(JSON.parse(data));
        }
      } catch (error) {
        console.error(`${key} 로드 실패:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadValue();
  }, [key]);

  // 값 변경 시 저장
  const setValue = async (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const fileName = `${key}.json`;
      await writeTextFile(fileName, JSON.stringify(valueToStore, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
    } catch (error) {
      console.error(`${key} 저장 실패:`, error);
    }
  };

  return [storedValue, setValue, isLoading];
}
