import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

/**
 * AppData 디렉토리에서 JSON 파일을 읽는 유틸리티 함수
 */
export async function readJsonFile<T>(fileName: string): Promise<T | null> {
  try {
    const fileExists = await exists(fileName, {
      baseDir: BaseDirectory.AppData,
    });

    if (!fileExists) {
      return null;
    }

    const data = await readTextFile(fileName, {
      baseDir: BaseDirectory.AppData,
    });
    
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`${fileName} 읽기 실패:`, error);
    return null;
  }
}

/**
 * AppData 디렉토리에 JSON 파일을 쓰는 유틸리티 함수
 */
export async function writeJsonFile<T>(
  fileName: string,
  data: T
): Promise<boolean> {
  try {
    await writeTextFile(fileName, JSON.stringify(data, null, 2), {
      baseDir: BaseDirectory.AppData,
    });
    return true;
  } catch (error) {
    console.error(`${fileName} 쓰기 실패:`, error);
    return false;
  }
}
