import { calculateSimilarity, countKeywordMatches } from './keyword-extractor';
import { extractKeywordsHybrid } from './hybrid-keyword-extractor';

/**
 * Q&A 데이터베이스에서 질문 검색 (하이브리드 키워드 추출 사용)
 * @param {Object[]} qnaList - Q&A 데이터 배열
 * @param {string} searchQuery - 사용자 질문
 * @param {string} category - 선택된 카테고리 ("all" 또는 특정 카테고리)
 * @param {number} maxResults - 최대 결과 개수 (기본값: 3)
 * @param {number} minSimilarity - 최소 유사도 임계값 (기본값: 0.15, 즉 15%)
 * @param {boolean} isOCR - OCR 텍스트 여부 (기본값: false)
 * @returns {Promise<Object>} - 검색 결과 및 추출 정보
 */
export async function searchQnA(qnaList, searchQuery, category = 'all', maxResults = 3, minSimilarity = 0.15, isOCR = false) {
  if (!qnaList || !Array.isArray(qnaList) || qnaList.length === 0) {
    return {
      results: [],
      extractionInfo: null
    };
  }

  if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
    return {
      results: [],
      extractionInfo: null
    };
  }

  // OCR 텍스트 자동 감지 (마커가 있는 경우)
  if (!isOCR && searchQuery.includes('[이미지에서 추출된 텍스트]')) {
    isOCR = true;
    console.log('🖼️ [Search] OCR text marker detected, enabling OCR mode');
  }

  // 1. 하이브리드 키워드 추출
  let extractionResult = await extractKeywordsHybrid(searchQuery, { isOCR });
  let queryKeywords = extractionResult.keywords;

  // 키워드 추출 실패 시 폴백
  if (queryKeywords.length === 0) {
    console.log('⚠️ No keywords extracted, falling back to basic word splitting.');
    queryKeywords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    
    // extractionResult 정보 업데이트
    extractionResult = {
      ...extractionResult,
      keywords: queryKeywords,
      source: 'fallback',
      confidence: 0.5
    };
  }

  console.log(`
🔎 Search Summary:
- Query: "${searchQuery}"
- Keywords: [${queryKeywords.join(', ')}]
- Source: ${extractionResult.source}
- Confidence: ${Math.round(extractionResult.confidence * 100)}%
- Cost: $${extractionResult.cost.toFixed(6)}
- Time: ${extractionResult.processingTime}ms
  `);

  // 2. 카테고리 필터링
  let filteredList = qnaList;
  if (category && category !== 'all') {
    filteredList = qnaList.filter(qna =>
      qna.category.toLowerCase() === category.toLowerCase()
    );
  }

  // 3. 각 Q&A 항목에 대해 유사도 점수 계산
  const scoredResults = filteredList.map(qna => {
    // 3-1. Q&A의 키워드와 질문 키워드 간 유사도
    const keywordSimilarity = calculateSimilarity(queryKeywords, qna.keywords || []);

    // 3-2. 텍스트에서 직접 키워드 매칭 (새 스키마)
    const titleMatches = countKeywordMatches(qna.title || '', queryKeywords);
    const bodyMatches = countKeywordMatches(qna.body || '', queryKeywords);
    const ocrMatches = countKeywordMatches(qna.ocrText || '', queryKeywords);
    const answerMatches = countKeywordMatches(qna.answer || '', queryKeywords);

    // 3-3. 종합 점수 계산 (0으로 나누기 방지)
    const keywordCount = queryKeywords.length > 0 ? queryKeywords.length : 1
    let totalScore = 0

    if (isOCR) {
      // OCR 검색일 경우: OCR 텍스트 매칭에 높은 가중치
      totalScore =
        (ocrMatches / keywordCount) * 0.8 + // OCR 텍스트 일치
        (titleMatches / keywordCount) * 0.1 + // 제목 일치
        (bodyMatches / keywordCount) * 0.05 + // 질문 본문 일치
        (answerMatches / keywordCount) * 0.05 // 답변 일치
    } else {
      // 일반 텍스트 검색일 경우: 기존 로직 유지
      totalScore =
        (keywordSimilarity * 0.05) +
        (titleMatches / keywordCount * 0.6) +
        (bodyMatches / keywordCount * 0.25) +
        (answerMatches / keywordCount * 0.1);
    }

    return {
      ...qna,
      score: totalScore
    };
  });

  // 4. 점수 순으로 정렬 (높은 점수부터)
  const sortedResults = scoredResults
    .filter(result => result.score >= minSimilarity) // 최소 유사도 임계값 이상만 포함
    .sort((a, b) => b.score - a.score);

  // 5. 상위 N개 결과와 추출 정보 반환
  return {
    results: sortedResults.slice(0, maxResults),
    extractionInfo: {
      keywords: queryKeywords,
      source: extractionResult.source,
      confidence: extractionResult.confidence,
      cost: extractionResult.cost,
      processingTime: extractionResult.processingTime,
      category: extractionResult.category,
      correctedTerms: extractionResult.correctedTerms
    }
  };
}

/**
 * Q&A 데이터베이스 로드
 * @returns {Promise<Object[]>} - Q&A 데이터 배열
 */
export async function loadQnADatabase() {
  try {
    const response = await fetch('/data/qna-database.json');
    if (!response.ok) {
      throw new Error(`Failed to load QnA database: ${response.status}`);
    }
    const data = await response.json();
    return data.qnaList || [];
  } catch (error) {
    console.error('Error loading QnA database:', error);
    return [];
  }
}
