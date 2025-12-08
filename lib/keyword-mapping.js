/**
 * 한글 → 영문 기술 용어 매핑
 * 학생들이 자주 사용하는 한글 용어를 표준 영문 용어로 변환
 */
export const KO_TO_EN_MAPPING = {
  // 프로그래밍 언어
  "자바스크립트": "JavaScript",
  "자스": "JavaScript",
  "제이에스": "JavaScript",
  "자바스크립": "JavaScript",
  "타입스크립트": "TypeScript",
  "타스": "TypeScript",
  "파이썬": "Python",
  "자바": "Java",
  "씨언어": "C",
  "씨플플": "C++",

  // 프레임워크/라이브러리
  "리액트": "React",
  "리엑트": "React",
  "뷰": "Vue",
  "앵귤러": "Angular",
  "넥스트": "Next.js",
  "넥스트제이에스": "Next.js",
  "넥스트js": "Next.js",
  "익스프레스": "Express",
  "노드": "Node.js",
  "노드제이에스": "Node.js",

  // 도구
  "깃": "Git",
  "깃헙": "GitHub",
  "깃랩": "GitLab",
  "비주얼스튜디오코드": "VSCode",
  "비주얼스튜디오": "VSCode",
  "비스코": "VSCode",
  "브이에스코드": "VSCode",
  "비주얼코드": "VSCode",

  // CSS 개념
  "플렉스박스": "flexbox",
  "플렉스": "flexbox",
  "그리드": "grid",
  "포지션": "position",

  // JavaScript 개념
  "프로미스": "Promise",
  "어싱크": "async",
  "어웨잇": "await",
  "콜백": "callback",

  // React 훅
  "유즈스테이트": "useState",
  "유즈이펙트": "useEffect",
  "유즈콜백": "useCallback",
  "유즈메모": "useMemo",

  // 기타
  "에이피아이": "API",
  "레스트": "REST",
  "제이슨": "JSON",
  "에이치티엠엘": "HTML",
  "씨에스에스": "CSS",
  "돔": "DOM",
}

/**
 * 오타/유사어 → 정규 용어 매핑
 * 자주 발생하는 오타나 다양한 표기법을 표준으로 통일
 */
export const TYPO_MAPPING = {
  // VSCode 관련
  "vsc": "VSCode",
  "vs코드": "VSCode",
  "vscode": "VSCode",
  "visualstudiocode": "VSCode",

  // React 관련
  "리엑트": "React",
  "리엑트후크": "React Hook",
  "리액트훅": "React Hook",

  // Next.js 관련
  "넥스트js": "Next.js",
  "nextjs": "Next.js",

  // TypeScript 관련
  "타입스크립": "TypeScript",
  "typescript": "TypeScript",
  "ts": "TypeScript",

  // JavaScript 관련
  "자바스크립": "JavaScript",
  "javascript": "JavaScript",
  "js": "JavaScript",

  // Git 관련
  "깃헙": "GitHub",
  "github": "GitHub",
  "깃랩": "GitLab",

  // CSS 관련
  "플렉스": "flexbox",
  "flex": "flexbox",
  "css3": "CSS",

  // 기타
  "api": "API",
  "json": "JSON",
  "html5": "HTML",
  "html": "HTML",
}

/**
 * 텍스트에 매핑 적용
 * @param {string} text - 원본 텍스트
 * @returns {string} - 매핑이 적용된 텍스트
 */
export function applyMapping(text) {
  if (!text || typeof text !== 'string') {
    return text
  }

  let result = text

  // 1. 한영 매핑 적용 (대소문자 무시)
  for (const [ko, en] of Object.entries(KO_TO_EN_MAPPING)) {
    const regex = new RegExp(ko, 'gi')
    result = result.replace(regex, en)
  }

  // 2. 오타 수정 (대소문자 무시)
  for (const [typo, correct] of Object.entries(TYPO_MAPPING)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi')
    result = result.replace(regex, correct)
  }

  return result
}

/**
 * 매핑 사전에 있는 용어인지 확인
 * @param {string} term - 확인할 용어
 * @returns {boolean} - 사전에 있으면 true
 */
export function isMappedTerm(term) {
  const lowerTerm = term.toLowerCase()

  // 한영 매핑에 있는지 확인
  for (const ko of Object.keys(KO_TO_EN_MAPPING)) {
    if (ko.toLowerCase() === lowerTerm) return true
  }

  // 오타 매핑에 있는지 확인
  for (const typo of Object.keys(TYPO_MAPPING)) {
    if (typo.toLowerCase() === lowerTerm) return true
  }

  return false
}

/**
 * 용어의 표준 형태 반환
 * @param {string} term - 원본 용어
 * @returns {string} - 표준 형태 용어
 */
export function getStandardTerm(term) {
  const lowerTerm = term.toLowerCase()

  // 한영 매핑에서 찾기
  for (const [ko, en] of Object.entries(KO_TO_EN_MAPPING)) {
    if (ko.toLowerCase() === lowerTerm) return en
  }

  // 오타 매핑에서 찾기
  for (const [typo, correct] of Object.entries(TYPO_MAPPING)) {
    if (typo.toLowerCase() === lowerTerm) return correct
  }

  // 매핑에 없으면 원본 반환
  return term
}
