/**
 * OCR로 추출된 터미널/에러 텍스트를 정제하는 유틸리티
 */

/**
 * 터미널 프롬프트 패턴 (제거 대상)
 * - PowerShell: PS C:\Users\...>
 * - Bash/Zsh: $ or username@hostname:~$
 * - CMD: C:\...>
 * - 일반 쉘 프롬프트: >, $, #
 */
const PROMPT_PATTERNS = [
  /^PS\s+[A-Z]:\\[^>]+>\s*/gm,           // PowerShell 프롬프트
  /^[A-Z]:\\[^>]+>\s*/gm,                // CMD 프롬프트
  /^[\w\-]+@[\w\-]+:[~\/\w\-]*[$#]\s*/gm, // Bash/Zsh 프롬프트
  /^[$#]\s+/gm,                          // 단순 $ 또는 # 프롬프트
  /^>\s+/gm,                             // > 프롬프트
];

/**
 * 명령어 에코 패턴 (제거할 수 있는 명령어 라인)
 * 단, 에러 메시지 내부에 포함된 명령어는 유지
 */
const COMMAND_ECHO_PATTERNS = [
  /^\+\s+[\w\-]+/gm,  // PowerShell 에코 (+ npm, + git 등)
];

/**
 * 중요 에러 키워드 (이 키워드가 포함된 라인은 반드시 유지)
 */
const ERROR_KEYWORDS = [
  'error',
  'exception',
  'failed',
  'cannot',
  'unable',
  'denied',
  'unauthorized',
  'forbidden',
  'not found',
  'invalid',
  'syntax error',
  '오류',
  '실패',
  '없습니다',
  '없음',
  '거부',
  '권한',
];

/**
 * 에러 관련 필드명 (PowerShell, Stack Trace 등)
 */
const ERROR_FIELD_PATTERNS = [
  /CategoryInfo\s*:/i,
  /FullyQualifiedErrorId\s*:/i,
  /at\s+[\w\.]+\s*\(/i,  // Stack trace
  /Traceback/i,
  /File\s+"[^"]+",\s+line\s+\d+/i,  // Python traceback
];

/**
 * OCR 텍스트를 정제하여 핵심 에러 정보만 추출
 * @param {string} ocrText - OCR로 추출된 원본 텍스트
 * @returns {string} - 정제된 텍스트
 */
export function filterOCRText(ocrText) {
  if (!ocrText || typeof ocrText !== 'string') {
    return '';
  }

  const lines = ocrText.split('\n');
  const filteredLines = [];
  let inErrorContext = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    // 1. 프롬프트 라인 제거
    let isPromptLine = false;
    for (const pattern of PROMPT_PATTERNS) {
      if (pattern.test(line)) {
        line = line.replace(pattern, '').trim();
        isPromptLine = true;
        break;
      }
    }

    // 프롬프트만 있고 내용이 없으면 스킵
    if (isPromptLine && !line) {
      continue;
    }

    // 2. 명령어 에코 라인 체크 (+ npm install 같은)
    let isCommandEcho = false;
    for (const pattern of COMMAND_ECHO_PATTERNS) {
      if (pattern.test(line)) {
        isCommandEcho = true;
        break;
      }
    }

    // 명령어 에코이지만 에러 키워드가 없으면 스킵
    if (isCommandEcho) {
      const hasErrorKeyword = ERROR_KEYWORDS.some(keyword =>
        line.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasErrorKeyword) {
        continue;
      }
    }

    // 3. 에러 키워드 체크
    const hasErrorKeyword = ERROR_KEYWORDS.some(keyword =>
      line.toLowerCase().includes(keyword.toLowerCase())
    );

    // 4. 에러 필드 패턴 체크
    const hasErrorField = ERROR_FIELD_PATTERNS.some(pattern =>
      pattern.test(line)
    );

    // 5. 에러 관련 라인이면 추가
    if (hasErrorKeyword || hasErrorField) {
      filteredLines.push(line);
      inErrorContext = true;
    } else if (inErrorContext) {
      // 에러 컨텍스트 내부에서는 다음 2줄까지 포함 (상세 정보일 수 있음)
      filteredLines.push(line);
      // 2줄 후에는 컨텍스트 종료
      if (filteredLines.length > 0 &&
          filteredLines.slice(-3).filter(l => !hasErrorKeyword).length >= 2) {
        inErrorContext = false;
      }
    }
  }

  // 6. 결과가 너무 짧으면 원본의 중요 부분을 반환
  const result = filteredLines.join('\n').trim();

  if (result.length < 20) {
    // 필터링이 너무 강하면 최소한 에러 키워드가 포함된 라인은 반환
    const errorLines = lines.filter(line =>
      ERROR_KEYWORDS.some(keyword =>
        line.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (errorLines.length > 0) {
      return errorLines.join('\n').trim();
    }

    // 그래도 없으면 원본 반환
    return ocrText;
  }

  return result;
}

/**
 * 정제된 텍스트에서 제목 생성을 위한 핵심 문장 추출
 * @param {string} filteredText - 정제된 텍스트
 * @param {number} maxLength - 최대 길이 (기본: 80)
 * @returns {string} - 제목용 텍스트
 */
export function extractTitleFromFilteredText(filteredText, maxLength = 80) {
  if (!filteredText) return '';

  const lines = filteredText.split('\n').filter(line => line.trim());

  // 1. Exception이나 Error 타입 찾기 (가장 우선순위 높음)
  const exceptionLine = lines.find(line =>
    /Exception|Error/i.test(line) && line.split(':').length >= 2
  );

  if (exceptionLine) {
    // "PSSecurityException" 또는 "ZeroDivisionError: division by zero" 형태 추출
    const match = exceptionLine.match(/(\w+(Exception|Error)[^:]*)(:\s*(.+))?/);
    if (match) {
      const errorType = match[1];
      const errorMsg = match[4];

      if (errorMsg && errorMsg.length < maxLength - errorType.length - 3) {
        return `${errorType}: ${errorMsg}`;
      }
      return errorType;
    }
  }

  // 2. "보안 오류:", "npm ERR!" 같은 에러 레이블 찾기
  const labeledErrorLine = lines.find(line =>
    /오류:|error:|ERR!|failed/i.test(line)
  );

  if (labeledErrorLine) {
    let cleaned = labeledErrorLine
      .replace(/^[+\-*#$>\s]+/, '')  // 특수문자 제거
      .replace(/\s+/g, ' ')          // 공백 정리
      .trim();

    // URL이나 파일 경로가 너무 길면 제거
    if (cleaned.length > maxLength) {
      // "에러 메시지 [긴 URL]" 형태면 URL 제거
      cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '[...]');
      cleaned = cleaned.replace(/[A-Z]:\\[^\s]+/g, '[...]');
    }

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    // 여전히 길면 자르기
    return cleaned.substring(0, maxLength - 3) + '...';
  }

  // 3. CategoryInfo 같은 특수 필드에서 추출
  const categoryLine = lines.find(line =>
    /CategoryInfo|FullyQualifiedErrorId/i.test(line)
  );

  if (categoryLine) {
    const match = categoryLine.match(/:\s*([^:]+)/);
    if (match && match[1]) {
      const info = match[1].trim();
      if (info.length <= maxLength) {
        return info;
      }
    }
  }

  // 4. 그 외 첫 번째 에러 키워드 포함 라인
  const errorLine = lines.find(line =>
    ERROR_KEYWORDS.some(keyword =>
      line.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (errorLine) {
    const cleaned = errorLine
      .replace(/^[+\-*#$>\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    return cleaned.substring(0, maxLength - 3) + '...';
  }

  // 5. 마지막 수단: 첫 번째 줄
  const firstLine = lines[0];
  if (firstLine && firstLine.length <= maxLength) {
    return firstLine;
  }

  return firstLine ? firstLine.substring(0, maxLength - 3) + '...' : '';
}

/**
 * 디버깅용: 필터링 전후 비교
 */
export function debugFilter(ocrText) {
  const filtered = filterOCRText(ocrText);
  const title = extractTitleFromFilteredText(filtered);

  return {
    original: ocrText,
    originalLength: ocrText.length,
    filtered: filtered,
    filteredLength: filtered.length,
    suggestedTitle: title,
    reduction: `${Math.round((1 - filtered.length / ocrText.length) * 100)}%`
  };
}
