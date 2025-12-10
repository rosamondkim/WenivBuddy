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
  // 이미지 관련 불용어
  "uploads",
  "images",
  // 일상 대화 용어 (키워드로 부적절한 표현들)
  "한번",
  "여나요",
  "캡쳐대",
  "캡쳐대로",
  "따라해보실래요",
  "해보실래요",
  "보실래요",
  "실래요",
  "해볼래요",
  "볼래요",
  "해보세요",
  "보세요",
  "해보실",
  "보실",
  "주세요",
  "해주세요",
  "알려주세요",
  "가르쳐주세요",
  "설명해주세요",
  "말씀해주세요",
  "부탁드립니다",
  "부탁합니다",
  "감사합니다",
  "고맙습니다",
  // 추가 일상 용어
  "강사님",
  "선생님",
  "나오는게",
  "나와요",
  "되나요",
  "되요",
  "아니라",
  "그래요",
  "처럼",
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
 * 마크다운 구문 제거 (이미지, 링크 등)
 */
function cleanMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 이미지 마크다운 제거
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 (텍스트만 남김)
    .replace(/^```[\w]*\n?/gm, '') // 코드 블록 시작 마커만 제거
    .replace(/\n?```$/gm, '') // 코드 블록 끝 마커만 제거
    .replace(/`([^`\n]+)`/g, '$1') // 인라인 코드 (내용 유지)
    .replace(/#{1,6}\s+/g, '') // 헤딩 제거
    .trim();
}

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

  // 확장된 한국어 조사 목록 (더 많은 조사 패턴 포함)
  const particles = [
    "은", "는", "이", "가", "을", "를", "에", "에서", "으로", "로", "의", "도", "만",
    "부터", "까지", "에게", "한테", "께", "보다", "처럼", "같이"
  ];
  const particleRegex = new RegExp(`(${particles.join('|')})$`);

  // 동사/형용사 어미 패턴 (불완전한 동사 조각 제거)
  const verbEndings = /^(되었|하지|않습|합니|했습|됩니|입니|있습|없습|같아|봐요|해요|나요|세요|주세|드립|드려|클릭|나오|나와|되나|그래).*$/;

  for (const word of words) {
    // 숫자만 있는 단어 제외
    if (/^\d+$/.test(word)) {
      continue;
    }

    // 해시처럼 보이는 긴 영숫자 조합 제외 (10자 이상)
    if (/^[a-f0-9]{10,}$/i.test(word)) {
      continue;
    }

    // 한글만 있는 단어
    if (/^[가-힣]+$/.test(word)) {
      // 동사/형용사 어미로 시작하는 단어 제외
      if (verbEndings.test(word)) {
        continue;
      }

      // 단어 끝에서 조사를 제거
      const baseWord = word.replace(particleRegex, '');

      // 2글자 이상, 불용어 제외
      if (baseWord.length >= 2 && !STOP_WORDS.has(baseWord)) {
        nouns.push(baseWord);
        continue; // baseWord만 추가하고 다음으로
      }
    }
    // 영문만 있는 단어
    else if (/^[a-zA-Z]+$/.test(word)) {
      // 3글자 이상, 불용어 제외
      if (word.length >= 3 && !STOP_WORDS.has(word)) {
        nouns.push(word);
      }
    }
  }

  return nouns;
}

/**
 * N-gram 생성 (단어 단위 매칭으로 놓칠 수 있는 의미 포착)
 */
function generateNGrams(text, n = 2, maxNGrams = 10) {
  const words = text.split(/\s+/);
  const ngrams = [];

  for (let i = 0; i <= words.length - n; i++) {
    const ngramWords = words.slice(i, i + n);

    // 숫자만 있는 단어나 해시 패턴이 포함된 경우 제외
    const hasInvalidWord = ngramWords.some(word => {
      // 숫자만 있는 단어
      if (/^\d+$/.test(word)) return true;
      // 해시처럼 보이는 긴 영숫자 조합 (10자 이상)
      if (/^[a-f0-9]{10,}$/i.test(word)) return true;
      return false;
    });

    if (hasInvalidWord) {
      continue;
    }

    const ngram = ngramWords.join(" ");

    // 불용어가 포함되거나 너무 짧거나 긴 n-gram 제외
    const hasStopWord = ngramWords.some(word => STOP_WORDS.has(word));
    if (hasStopWord || ngram.length < 4 || ngram.length > 30) {
      continue;
    }

    // 숫자나 특수문자만 있는 n-gram 제외
    if (/^[\d\s]+$/.test(ngram)) {
      continue;
    }

    // 기술 용어가 하나 이상 포함된 n-gram만 허용 (품질 향상)
    const hasTechTerm = ngramWords.some(word => {
      // 영문 3글자 이상 (기술 용어 가능성)
      if (/^[a-zA-Z]{3,}$/.test(word)) return true;
      // 대문자로 시작하는 단어
      if (/^[A-Z]/.test(word)) return true;
      return false;
    });

    // 기술 용어가 없으면 제외 (일상 대화 구문 필터링)
    if (!hasTechTerm) {
      continue;
    }

    ngrams.push(ngram);
  }

  // 빈도수 기준으로 상위 N개만 반환 (너무 많은 n-gram 방지)
  return ngrams.slice(0, maxNGrams);
}

/**
 * 질문에서 키워드 추출
 * @param {string} question - 사용자 질문
 * @param {object} options - 추출 옵션
 * @param {number} options.maxKeywords - 최대 키워드 개수 (기본: 20)
 * @param {boolean} options.isOCR - OCR 텍스트 여부 (기본: false)
 * @returns {string[]} - 추출된 키워드 배열
 */
export function extractKeywords(question, options = {}) {
  if (!question || typeof question !== "string") {
    return [];
  }

  const { maxKeywords = 20, isOCR = false } = options;

  // OCR 텍스트는 더 엄격하게 제한
  const effectiveMaxKeywords = isOCR ? Math.min(maxKeywords, 15) : maxKeywords;
  const maxNGrams = isOCR ? 5 : 10; // OCR은 n-gram을 더 제한

  const keywords = new Set();

  // 0. 마크다운 구문 제거 (이미지, 링크 등)
  const cleanedQuestion = cleanMarkdown(question);

  // 1. 기술 용어 추출 (정제된 텍스트에서, 대소문자 유지) - 가장 중요
  const techTerms = extractTechTerms(cleanedQuestion);
  techTerms.forEach((term) => keywords.add(term));

  // 2. 정규화된 텍스트에서 명사 추출
  const normalizedText = normalizeText(cleanedQuestion);
  const nouns = extractNouns(normalizedText);

  // 명사는 최대 개수 제한
  const maxNouns = isOCR ? 8 : 15;
  nouns.slice(0, maxNouns).forEach((noun) => keywords.add(noun));

  // 3. 2-gram 생성 (구문 매칭용) - OCR의 경우 제한적으로만 추가
  if (!isOCR || techTerms.length < 5) {
    const bigrams = generateNGrams(normalizedText, 2, maxNGrams);
    bigrams.forEach((bigram) => keywords.add(bigram));
  }

  // 4. 최대 키워드 개수 제한 (기술 용어 우선)
  const allKeywords = Array.from(keywords);

  // 기술 용어를 우선순위로 정렬
  const sortedKeywords = allKeywords.sort((a, b) => {
    const aIsTech = techTerms.includes(a);
    const bIsTech = techTerms.includes(b);

    if (aIsTech && !bIsTech) return -1;
    if (!aIsTech && bIsTech) return 1;

    // 길이가 짧은 것 우선 (더 핵심적인 키워드)
    return a.length - b.length;
  });

  return sortedKeywords.slice(0, effectiveMaxKeywords);
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
 * 텍스트에 키워드가 포함되어 있는지 확인 (부분 매칭 포함)
 * @param {string} text - 검색 대상 텍스트
 * @param {string[]} keywords - 키워드 배열
 * @returns {number} - 매칭된 키워드 개수 (부분 매칭은 0.5점)
 */
export function countKeywordMatches(text, keywords) {
  if (!text || !keywords?.length) {
    return 0;
  }

  // 마크다운 제거 후 정규화
  const cleanedText = cleanMarkdown(text);
  const normalizedText = normalizeText(cleanedText);
  let matchCount = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();

    // 완전 일치 (1점)
    if (normalizedText.includes(normalizedKeyword)) {
      matchCount++;
    }
    // 부분 매칭 (0.5점) - 한글 2글자 이상 또는 영문 3글자 이상
    else if (normalizedKeyword.length >= 2) {
      const textWords = normalizedText.split(/\s+/);
      const hasPartialMatch = textWords.some(word => {
        // 키워드가 단어에 포함되거나, 단어가 키워드에 포함
        return word.includes(normalizedKeyword) || normalizedKeyword.includes(word);
      });

      if (hasPartialMatch) {
        matchCount += 0.5;
      }
    }
  }

  return matchCount;
}
