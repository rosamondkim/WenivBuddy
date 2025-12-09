import { extractKeywords } from './keyword-extractor'
import { applyMapping, getStandardTerm } from './keyword-mapping'
import { extractKeywordsWithLLM } from './llm-keyword-extractor'

/**
 * 신뢰도 계산
 * 추출된 키워드의 품질을 평가하여 0~1 사이의 점수 반환
 *
 * @param {string[]} keywords - 추출된 키워드 배열
 * @param {string} originalQuestion - 원본 질문
 * @returns {number} - 신뢰도 점수 (0~1)
 */
function calculateConfidence(keywords, originalQuestion) {
  if (!keywords || keywords.length === 0) {
    return 0
  }

  let score = 0

  // 1. 기술 용어 포함 여부 (50점)
  const hasTechTerm = keywords.some(k => {
    // 대문자로 시작하는 용어 (React, Git, VSCode 등)
    if (/^[A-Z]/.test(k)) return true
    // 점이 포함된 용어 (Node.js, Next.js 등)
    if (k.includes('.')) return true
    // 5글자 이상의 영문 단어 (flexbox, position 등)
    if (/^[a-zA-Z]{5,}$/.test(k)) return true
    return false
  })

  if (hasTechTerm) {
    score += 50
  }

  // 2. 키워드 개수 (30점)
  if (keywords.length >= 3) {
    score += 30
  } else if (keywords.length >= 2) {
    score += 20
  } else if (keywords.length >= 1) {
    score += 10
  }

  // 3. 영문 키워드 비율 (20점)
  const englishKeywords = keywords.filter(k => /[a-zA-Z]/.test(k))
  const englishRatio = englishKeywords.length / keywords.length
  score += englishRatio * 20

  // 0~1 범위로 정규화
  return Math.min(score / 100, 1)
}

/**
 * 하이브리드 키워드 추출
 * 로컬 추출을 먼저 시도하고, 신뢰도가 낮으면 LLM을 사용
 *
 * @param {string} question - 사용자 질문
 * @param {Object} options - 추출 옵션
 * @param {number} options.confidenceThreshold - 신뢰도 임계값 (기본: 0.7)
 * @param {boolean} options.forceLLM - 강제로 LLM 사용 (기본: false)
 * @param {boolean} options.isOCR - OCR 텍스트 여부 (기본: false)
 * @returns {Promise<Object>} - 추출 결과
 */
export async function extractKeywordsHybrid(question, options = {}) {
  const {
    confidenceThreshold = 0.7,
    forceLLM = false,
    isOCR: isOCRInput = false
  } = options

  const startTime = Date.now()

  // 0. 입력 검증
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return {
      keywords: [],
      source: 'none',
      confidence: 0,
      cost: 0,
      processingTime: 0
    }
  }

  // OCR 텍스트 자동 감지 (옵션으로 전달되지 않은 경우)
  let isOCR = isOCRInput
  if (!isOCR && question.length > 150) {
    // 긴 텍스트 중 특수 문자나 줄바꿈이 많으면 OCR로 판단
    const specialCharCount = (question.match(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length
    const lineBreakCount = (question.match(/\n/g) || []).length

    if (specialCharCount > 20 || lineBreakCount > 5) {
      isOCR = true
      console.log('🖼️ [Hybrid] OCR text detected automatically')
    }
  }

  // 1단계: 로컬 추출
  console.log('🔍 [Hybrid] Starting keyword extraction...')
  console.log(`📝 Question: "${question.substring(0, 100)}..."`)
  if (isOCR) {
    console.log('🖼️ [Hybrid] OCR mode enabled - stricter filtering')
  }

  const localKeywords = extractKeywords(question, { isOCR })
  console.log(`🏠 [Local] Extracted: [${localKeywords.join(', ')}]`)

  // 2단계: 한영 매핑 적용
  const mappedQuestion = applyMapping(question)
  const mappedKeywords = extractKeywords(mappedQuestion, { isOCR })

  // 매핑된 키워드를 표준 용어로 변환
  const standardizedKeywords = mappedKeywords.map(k => getStandardTerm(k))

  // 중복 제거 및 병합 (OCR의 경우 최대 개수 제한 더 엄격)
  const maxCombinedKeywords = isOCR ? 15 : 25
  const combinedKeywords = [...new Set([...localKeywords, ...standardizedKeywords])].slice(0, maxCombinedKeywords)
  console.log(`🔄 [Mapped] Combined: [${combinedKeywords.join(', ')}]`)

  // 3단계: 신뢰도 계산
  const confidence = calculateConfidence(combinedKeywords, question)
  console.log(`📊 [Confidence] Score: ${Math.round(confidence * 100)}%`)

  // OCR 텍스트의 경우 LLM 사용 강제 (더 정확한 키워드 추출)
  const shouldForceLLM = forceLLM || isOCR
  if (isOCR && !forceLLM) {
    console.log('🖼️ [Hybrid] OCR text detected - forcing LLM extraction for better quality')
  }

  // 4단계: 신뢰도 기반 처리
  if (!shouldForceLLM && confidence >= confidenceThreshold) {
    // 신뢰도 높음 → 로컬 결과 사용
    const processingTime = Date.now() - startTime
    console.log(`✅ [Local] High confidence, using local result (${processingTime}ms)`)

    return {
      keywords: combinedKeywords,
      source: 'local',
      confidence,
      cost: 0,
      processingTime,
      mappingApplied: mappedQuestion !== question
    }
  } else {
    // 신뢰도 낮음 → LLM 사용
    console.log(`🤖 [LLM] Low confidence (${Math.round(confidence * 100)}%), calling LLM...`)

    const llmResult = await extractKeywordsWithLLM(question)

    const processingTime = Date.now() - startTime

    if (llmResult && llmResult.keywords.length > 0) {
      // LLM 성공
      console.log(`✅ [LLM] Successfully extracted: [${llmResult.keywords.join(', ')}] (${processingTime}ms)`)

      // 비용 계산 (대략적)
      const estimatedCost = 0.0001 // 약 $0.0001 per request

      return {
        keywords: llmResult.keywords,
        category: llmResult.category,
        correctedTerms: llmResult.corrected_terms,
        source: 'llm',
        confidence,
        cost: estimatedCost,
        processingTime,
        model: llmResult.model,
        usage: llmResult.usage
      }
    } else {
      // LLM 실패 → 로컬 결과로 폴백
      console.log(`⚠️ [Fallback] LLM failed, using local result (${processingTime}ms)`)

      return {
        keywords: combinedKeywords,
        source: 'local_fallback',
        confidence,
        cost: 0,
        processingTime,
        fallbackReason: 'LLM unavailable or failed'
      }
    }
  }
}

/**
 * 배치 키워드 추출
 * 여러 질문에 대해 한 번에 키워드 추출
 *
 * @param {string[]} questions - 질문 배열
 * @param {Object} options - 추출 옵션
 * @returns {Promise<Object[]>} - 추출 결과 배열
 */
export async function extractKeywordsBatch(questions, options = {}) {
  console.log(`🔍 [Batch] Processing ${questions.length} questions...`)

  const results = await Promise.all(
    questions.map(q => extractKeywordsHybrid(q, options))
  )

  // 통계 계산
  const stats = {
    total: results.length,
    local: results.filter(r => r.source === 'local').length,
    llm: results.filter(r => r.source === 'llm').length,
    fallback: results.filter(r => r.source === 'local_fallback').length,
    totalCost: results.reduce((sum, r) => sum + r.cost, 0),
    avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  }

  console.log(`📊 [Batch] Stats:`, stats)

  return {
    results,
    stats
  }
}

/**
 * 키워드 추출 통계 계산
 * @param {Object[]} extractionResults - 추출 결과 배열
 * @returns {Object} - 통계 정보
 */
export function calculateStats(extractionResults) {
  if (!extractionResults || extractionResults.length === 0) {
    return {
      total: 0,
      localCount: 0,
      llmCount: 0,
      localPercentage: 0,
      llmPercentage: 0,
      totalCost: 0,
      avgConfidence: 0
    }
  }

  const total = extractionResults.length
  const localCount = extractionResults.filter(r => r.source === 'local').length
  const llmCount = extractionResults.filter(r => r.source === 'llm').length
  const totalCost = extractionResults.reduce((sum, r) => sum + (r.cost || 0), 0)
  const avgConfidence = extractionResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / total

  return {
    total,
    localCount,
    llmCount,
    localPercentage: (localCount / total) * 100,
    llmPercentage: (llmCount / total) * 100,
    totalCost,
    avgConfidence
  }
}
