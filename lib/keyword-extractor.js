/**
 * 한글 자모 분리를 위한 유니코드 상수
 */
const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const CHOSUNG_LIST = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

/**
 * 불용어 목록 (의미 없는 단어들)
 */
const STOP_WORDS = new Set([
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "에",
  "에서",
  "으로",
  "로",
  "의",
  "도",
  "만",
  "와",
  "과",
  "하고",
  "그리고",
  "하지만",
  "그런데",
  "그",
  "저",
  "것",
  "수",
  "등",
  "및",
  "때",
  "때문",
  "위해",
  "통해",
  "있다",
  "있는",
  "있어요",
  "없다",
  "없는",
  "없어요",
  "됩니다",
  "합니다",
  "해요",
  "인가요",
  "뭔가요",
  "어떻게",
  "왜",
  "언제",
  "어디서",
  "누가",
  "안",
  "못",
  "아니",
  "요",
  "네요",
  "나요",
]);

/**
 * 기술 용어 및 약어 사전
 */
const TECH_TERMS = new Set([
  "HTML",
  "CSS",
  "JavaScript",
  "TypeScript",
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Express",
  "Next.js",
  "Nuxt.js",
  "Nest.js",
  "Git",
  "GitHub",
  "GitLab",
  "VSCode",
  "VSC",
  "IDE",
  "API",
  "REST",
  "GraphQL",
  "JSON",
  "XML",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "npm",
  "yarn",
  "pnpm",
  "webpack",
  "vite",
  "useState",
  "useEffect",
  "useCallback",
  "useMemo",
  "useRef",
  "async",
  "await",
  "Promise",
  "callback",
  "flexbox",
  "grid",
  "position",
  "display",
  "SVG",
  "PNG",
  "JPG",
  "JPEG",
  "GIF",
  "WebP",
  "HTTP",
  "HTTPS",
  "URL",
  "URI",
  "DOM",
  "BOM",
  "AJAX",
  "fetch",
  "ES6",
  "ES7",
  "ESM",
  "CommonJS",
  "props",
  "state",
  "component",
  "hook",
]);

/**
 * 텍스트를 정규화 (소문자 변환, 공백 정리)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, " ") // 특수문자 제거
    .replace(/\s+/g, " ") // 연속 공백 제거
    .trim();
}

/**
 * 1단계 : (원본 텍스트에서) 기술 용어 추출 (대소문자 구분)
 */
function extractTechTerms(text) {
  const terms = [];
  const words = text.split(/\s+/); // 공백으로 단어 분리

  for (const word of words) {
    // 대소문자 무시하고 비교
    for (const term of TECH_TERMS) {
      if (word.toLowerCase() === term.toLowerCase()) {
        terms.push(term);
        break;
      }
    }
  }

  return terms;
}

// **예시:**
// 입력: "VSC에서 SVG 이미지를 클릭했을 때"
// ↓
// 단어 분리: ["VSC에서", "SVG", "이미지를", "클릭했을", "때"]
// ↓
// 매칭:
// - "VSC" → TECH_TERMS에서 "VSCode" 찾음 ✅
// - "SVG" → TECH_TERMS에서 "SVG" 찾음 ✅
// ↓
// 결과: ["VSCode", "SVG"]

/**
 * 2-3글자 이상의 명사 추출 (간단한 휴리스틱 사용)
 */
function extractNouns(text) {
  const words = text.split(/\s+/);
  const nouns = [];

  for (const word of words) {
    // 한글만 있는 단어
    if (/^[가-힣]+$/.test(word)) {
      // 2글자 이상, 불용어 제외
      if (word.length >= 2 && !STOP_WORDS.has(word)) {
        nouns.push(word);
      }
    }
    // 영문만 있는 단어
    else if (/^[a-zA-Z]+$/.test(word)) {
      // 3글자 이상
      if (word.length >= 3) {
        nouns.push(word);
      }
    }
  }

  return nouns;
}

/**
 * N-gram 생성 (단어 단위 매칭으로 놓칠 수 있는 의미 포착)
 */
function generateNGrams(text, n = 2) {
  const words = text.split(/\s+/);
  const ngrams = [];

  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(" ");
    if (ngram.length >= 4) {
      // 너무 짧은 n-gram 제외
      ngrams.push(ngram);
    }
  }

  return ngrams;
}

/**
 * 질문에서 키워드 추출
 * @param {string} question - 사용자 질문
 * @returns {string[]} - 추출된 키워드 배열
 */
export function extractKeywords(question) {
  if (!question || typeof question !== "string") {
    return [];
  }

  const keywords = new Set();

  // 1. 기술 용어 추출 (원본 텍스트에서, 대소문자 유지)
  const techTerms = extractTechTerms(question);
  techTerms.forEach((term) => keywords.add(term));

  // 2. 정규화된 텍스트에서 명사 추출
  const normalizedText = normalizeText(question);
  const nouns = extractNouns(normalizedText);
  nouns.forEach((noun) => keywords.add(noun));

  // 3. 2-gram 생성 (구문 매칭용)
  const bigrams = generateNGrams(normalizedText, 2);
  bigrams.forEach((bigram) => keywords.add(bigram));

  return Array.from(keywords);
}

/**
 * 두 키워드 집합의 유사도 계산 (Jaccard 유사도)
 * @param {string[]} keywords1 - 첫 번째 키워드 배열
 * @param {string[]} keywords2 - 두 번째 키워드 배열
 * @returns {number} - 0~1 사이의 유사도 점수
 */
export function calculateSimilarity(keywords1, keywords2) {
  if (!keywords1?.length || !keywords2?.length) {
    return 0;
  }

  const set1 = new Set(keywords1.map((k) => k.toLowerCase()));
  const set2 = new Set(keywords2.map((k) => k.toLowerCase()));

  // 교집합
  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  // 합집합
  const union = new Set([...set1, ...set2]);

  // Jaccard 유사도 = 교집합 / 합집합
  return intersection.size / union.size;
}

/**
 * 텍스트에 키워드가 포함되어 있는지 확인
 * @param {string} text - 검색 대상 텍스트
 * @param {string[]} keywords - 키워드 배열
 * @returns {number} - 매칭된 키워드 개수
 */
export function countKeywordMatches(text, keywords) {
  if (!text || !keywords?.length) {
    return 0;
  }

  const normalizedText = normalizeText(text);
  let matchCount = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedText.includes(normalizedKeyword)) {
      matchCount++;
    }
  }

  return matchCount;
}

/**
 * 디버깅용: 키워드 추출 과정 상세 출력
 */
export function extractKeywordsWithDetails(question) {
  const techTerms = extractTechTerms(question);
  const normalizedText = normalizeText(question);
  const nouns = extractNouns(normalizedText);
  const bigrams = generateNGrams(normalizedText, 2);

  return {
    original: question,
    normalized: normalizedText,
    techTerms,
    nouns,
    bigrams,
    allKeywords: extractKeywords(question),
  };
}
