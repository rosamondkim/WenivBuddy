/**
 * LLM 기반 키워드 추출
 * OpenAI API를 사용하여 질문에서 키워드를 추출하고
 * 한영 변환, 오타 수정, 컨텍스트 이해를 수행합니다.
 */

/**
 * LLM을 사용하여 키워드 추출
 * @param {string} question - 사용자 질문
 * @returns {Promise<Object|null>} - 추출 결과 또는 null (실패 시)
 */
export async function extractKeywordsWithLLM(question) {
  if (!question || typeof question !== 'string') {
    console.warn('⚠️ Invalid question for LLM extraction')
    return null
  }

  try {
    console.log('🤖 [LLM] Calling API for keyword extraction...')

    const response = await fetch('/api/extract-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ [LLM] API error:', response.status, errorData)

      // API 키가 설정되지 않은 경우
      if (response.status === 500 && errorData.error?.includes('API key')) {
        console.warn('⚠️ [LLM] OpenAI API key not configured. Falling back to local extraction.')
        return null
      }

      throw new Error(errorData.error || `API error: ${response.status}`)
    }

    const data = await response.json()

    console.log('✅ [LLM] Successfully extracted keywords:', data.keywords)

    return {
      keywords: data.keywords || [],
      category: data.category || 'all',
      corrected_terms: data.corrected_terms || {},
      source: 'llm',
      model: data.model || 'gpt-4o-mini',
      usage: data.usage
    }

  } catch (error) {
    console.error('❌ [LLM] Extraction failed:', error.message)
    return null
  }
}

/**
 * LLM 사용 가능 여부 확인
 * @returns {Promise<boolean>} - 사용 가능하면 true
 */
export async function isLLMAvailable() {
  try {
    const response = await fetch('/api/extract-keywords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question: 'test' })
    })

    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * LLM 토큰 사용량 추정
 * @param {string} question - 사용자 질문
 * @returns {Object} - 예상 토큰 수 및 비용
 */
export function estimateLLMCost(question) {
  // 대략적인 토큰 수 계산 (영문 4자 ≈ 1토큰, 한글 1.5자 ≈ 1토큰)
  const questionTokens = Math.ceil(question.length / 3)
  const systemPromptTokens = 100 // 시스템 프롬프트
  const responseTokens = 100 // 응답 JSON

  const inputTokens = questionTokens + systemPromptTokens
  const outputTokens = responseTokens

  // GPT-4o-mini 가격 (2024년 기준)
  const inputCost = (inputTokens / 1_000_000) * 0.150 // $0.150 per 1M tokens
  const outputCost = (outputTokens / 1_000_000) * 0.600 // $0.600 per 1M tokens
  const totalCost = inputCost + outputCost

  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: totalCost,
    estimatedCostKRW: totalCost * 1300 // 환율 대략 1300원
  }
}
