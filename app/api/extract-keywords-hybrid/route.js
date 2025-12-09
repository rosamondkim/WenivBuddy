import { NextResponse } from 'next/server'
import { extractKeywordsHybrid } from '@/lib/hybrid-keyword-extractor'

/**
 * 하이브리드 키워드 추출 API
 * POST /api/extract-keywords-hybrid
 *
 * 로컬 추출을 우선으로 시도하고, 신뢰도가 낮으면 LLM 사용
 */
export async function POST(request) {
  try {
    const { question, isOCR = false } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question parameter' },
        { status: 400 }
      )
    }

    console.log('🔍 [Hybrid Extract] Starting extraction...')
    if (isOCR) {
      console.log('🖼️ [Hybrid Extract] OCR mode enabled')
    }

    // 하이브리드 키워드 추출 (로컬 우선)
    const extractionResult = await extractKeywordsHybrid(question, {
      confidenceThreshold: 0.7,  // 신뢰도 70% 이상이면 로컬 사용
      forceLLM: false,            // LLM 강제 사용 안 함
      isOCR                       // OCR 텍스트 여부
    })

    console.log(`✅ [Hybrid Extract] Completed:`, {
      keywords: extractionResult.keywords,
      source: extractionResult.source,
      confidence: Math.round(extractionResult.confidence * 100) + '%'
    })

    return NextResponse.json({
      keywords: extractionResult.keywords || [],
      category: extractionResult.category || 'all',
      source: extractionResult.source,
      confidence: extractionResult.confidence,
      cost: extractionResult.cost || 0,
      processingTime: extractionResult.processingTime,
      ...(extractionResult.source === 'llm' && {
        model: extractionResult.model,
        usage: extractionResult.usage
      })
    })

  } catch (error) {
    console.error('❌ [Hybrid Extract] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
