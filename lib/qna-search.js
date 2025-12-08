import { calculateSimilarity, countKeywordMatches } from './keyword-extractor';
import { extractKeywordsHybrid } from './hybrid-keyword-extractor';

/**
 * Q&A 데이터베이스에서 질문 검색 (하이브리드 키워드 추출 사용)
 * @param {Object[]} qnaList - Q&A 데이터 배열
 * @param {string} searchQuery - 사용자 질문
 * @param {string} category - 선택된 카테고리 ("all" 또는 특정 카테고리)
 * @param {number} maxResults - 최대 결과 개수 (기본값: 3)
 * @param {number} minSimilarity - 최소 유사도 임계값 (기본값: 0.5, 즉 50%)
 * @returns {Promise<Object>} - 검색 결과 및 추출 정보
 */
export async function searchQnA(qnaList, searchQuery, category = 'all', maxResults = 3, minSimilarity = 0.5) {
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

  // 1. 하이브리드 키워드 추출
  const extractionResult = await extractKeywordsHybrid(searchQuery);
  const queryKeywords = extractionResult.keywords;

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

    // 3-2. 질문 텍스트에서 직접 키워드 매칭
    const questionMatches = countKeywordMatches(qna.question, queryKeywords);
    const answerMatches = countKeywordMatches(qna.answer, queryKeywords);

    // 3-3. 종합 점수 계산
    // - 키워드 유사도: 50%
    // - 질문 매칭: 30%
    // - 답변 매칭: 20%
    const totalScore =
      (keywordSimilarity * 0.5) +
      (questionMatches / queryKeywords.length * 0.3) +
      (answerMatches / queryKeywords.length * 0.2);

    return {
      ...qna,
      score: totalScore,
      matchedKeywords: queryKeywords.filter(kw =>
        qna.keywords?.some(qnaKw =>
          qnaKw.toLowerCase().includes(kw.toLowerCase()) ||
          kw.toLowerCase().includes(qnaKw.toLowerCase())
        )
      )
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
 * 카테고리별 Q&A 개수 계산
 * @param {Object[]} qnaList - Q&A 데이터 배열
 * @returns {Object} - 카테고리별 개수 객체
 */
export function getCategoryCounts(qnaList) {
  if (!qnaList || !Array.isArray(qnaList)) {
    return {};
  }

  const counts = {
    all: qnaList.length
  };

  qnaList.forEach(qna => {
    const category = qna.category || 'uncategorized';
    counts[category] = (counts[category] || 0) + 1;
  });

  return counts;
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

/**
 * 유사한 질문 찾기 (특정 질문과 유사한 다른 질문들)
 * @param {Object[]} qnaList - Q&A 데이터 배열
 * @param {string} currentQnaId - 현재 Q&A ID
 * @param {number} maxResults - 최대 결과 개수
 * @returns {Object[]} - 유사한 질문 배열
 */
export function findSimilarQuestions(qnaList, currentQnaId, maxResults = 3) {
  if (!qnaList || !currentQnaId) {
    return [];
  }

  const currentQna = qnaList.find(qna => qna.id === currentQnaId);
  if (!currentQna) {
    return [];
  }

  // 현재 질문 제외
  const otherQnas = qnaList.filter(qna => qna.id !== currentQnaId);

  // 유사도 계산
  const scoredResults = otherQnas.map(qna => {
    const similarity = calculateSimilarity(
      currentQna.keywords || [],
      qna.keywords || []
    );

    // 같은 카테고리면 가중치 부여
    const categoryBonus = currentQna.category === qna.category ? 0.2 : 0;

    return {
      ...qna,
      score: similarity + categoryBonus
    };
  });

  // 점수 순으로 정렬
  return scoredResults
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
