import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { filterOCRText } from '@/lib/ocr-text-filter'

/**
 * OCR 결과 캐시 (이미지 해시 기반)
 * 같은 이미지로 재검색 시 중복 OCR 호출 방지
 */
const ocrCache = new Map()
const CACHE_TTL = 15 * 60 * 1000 // 15분
const MAX_CACHE_SIZE = 100

/**
 * 이미지 해시 계산 (MD5)
 */
function calculateImageHash(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex')
}

/**
 * 캐시 정리 (오래된 항목 및 크기 제한)
 */
function cleanCache() {
  const now = Date.now()

  // 만료된 항목 제거
  for (const [hash, entry] of ocrCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      ocrCache.delete(hash)
    }
  }

  // 크기 제한 초과 시 오래된 항목부터 제거
  if (ocrCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(ocrCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toDelete = entries.slice(0, ocrCache.size - MAX_CACHE_SIZE)
    toDelete.forEach(([hash]) => ocrCache.delete(hash))
  }
}

/**
 * Hallucination 감지 함수
 * OCR 결과가 환각인지 확인
 *
 * 주의: 특정 키워드 자체를 차단하는 것이 아니라,
 * 매우 의심스러운 "패턴 조합"만 감지합니다.
 */
function isHallucination(text) {
  if (!text) return false

  // [NO_TEXT] 응답
  const looksNoText = /\[NO_TEXT\]/i.test(text)
  if (looksNoText) return true

  // 비정상적으로 긴 텍스트 (일반적인 스크린샷보다 훨씬 김)
  const tooLong = text.length > 1500
  if (tooLong) {
    console.warn(`⚠️ [OCR] Text too long (${text.length} chars) - possible hallucination`)
    return true
  }

  // 매우 구체적인 환각 패턴만 차단
  // "gemini" 명령어와 PowerShell 에러가 동시에 나타나는 패턴
  // (실제 이미지에 gemini가 없는데 이런 텍스트가 나오면 환각)
  const suspiciousGeminiPattern = /gemini.*powershell.*executionpolic/is

  if (suspiciousGeminiPattern.test(text)) {
    console.warn('⚠️ [OCR] Suspicious gemini+powershell pattern detected')
    return true
  }

  // 기타 환각 패턴은 일단 허용 (OCR 프롬프트 개선으로 해결)
  return false
}

/**
 * OpenAI Vision API를 사용한 OCR (이미지에서 텍스트 추출)
 * POST /api/ocr
 */
export async function POST(request) {
  try {
    // FormData에서 이미지 파일 추출
    const formData = await request.formData()
    const imageFile = formData.get('image')

    if (!imageFile) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    // API 키 확인
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found in environment variables')
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    console.log(`🖼️ [OCR] Processing image: ${imageFile.name} (${imageFile.size} bytes)`)

    // 이미지를 base64로 인코딩
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 이미지 해시 계산
    const imageHash = calculateImageHash(buffer)
    console.log(`🔑 [OCR Cache] Image hash: ${imageHash}`)

    // 캐시 확인
    cleanCache() // 캐시 정리
    const cachedResult = ocrCache.get(imageHash)

    if (cachedResult) {
      console.log(`✅ [OCR Cache] Cache hit! Returning cached result`)
      return NextResponse.json({
        ...cachedResult.data,
        cached: true,
        cacheAge: Date.now() - cachedResult.timestamp
      })
    }

    console.log(`❌ [OCR Cache] Cache miss - calling OpenAI API`)

    const base64Image = buffer.toString('base64')

    // 이미지 타입 확인
    const imageType = imageFile.type || 'image/png'

    // OpenAI Vision API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 에러/코드 스크린샷에서 "보이는 텍스트만" 추출하는 OCR 도우미입니다.
- 추측·추론·생성 금지. 이미지에 없는 단어/문장은 절대 만들지 마세요.
- 텍스트가 전혀 없으면 [NO_TEXT]만 반환하세요.
- UI 버튼/메뉴/툴팁 등 불필요한 UI 텍스트는 제외하세요.
- 코드/에러/파일 경로가 보이면 줄바꿈과 들여쓰기를 유지해 그대로 적으세요.
- 확신이 없으면 해당 줄을 생략하거나 [UNCERTAIN]으로 표시하지 말고, 아예 적지 마세요.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '아래 이미지에서 보이는 실제 텍스트(에러, 코드, 경로 등)를 그대로 추출해주세요. 추가 설명 없이 텍스트만 반환하세요. 텍스트가 없으면 [NO_TEXT].'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [OCR] OpenAI API error:', response.status, errorText)

      // 특정 에러 처리
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid' },
          { status: 500 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // OpenAI API 응답에서 추출된 텍스트
    const extractedText = data.choices[0].message.content.trim()

    console.log(`📊 [OCR] Extracted text length: ${extractedText.length} chars`)
    console.log(`💰 [OCR] Token usage: ${data.usage.total_tokens} tokens`)

    // Hallucination 검증
    if (isHallucination(extractedText)) {
      console.warn(`❌ [OCR] Hallucination detected - returning empty text`)

      // 환각으로 판단되면 빈 결과 반환 (캐시에는 저장하지 않음)
      return NextResponse.json({
        text: '',
        model: 'gpt-4o-mini',
        usage: data.usage,
        note: 'hallucination suspected - returned empty text',
        imageSize: imageFile.size,
        imageType: imageFile.type
      })
    }

    console.log(`✅ [OCR] Validation passed - returning extracted text`)

    // 터미널 에러 텍스트 정제 (프롬프트, 경로 등 제거)
    const filteredText = filterOCRText(extractedText)
    const reductionPercent = Math.round((1 - filteredText.length / extractedText.length) * 100)

    if (filteredText !== extractedText) {
      console.log(`🔧 [OCR] Text filtered: ${extractedText.length} → ${filteredText.length} chars (${reductionPercent}% reduction)`)
    }

    // 성공한 결과를 캐시에 저장 (정제된 텍스트 사용)
    const result = {
      text: filteredText,
      originalText: extractedText,  // 디버깅용 원본 보관
      model: 'gpt-4o-mini',
      usage: data.usage,
      imageSize: imageFile.size,
      imageType: imageFile.type,
      filtered: filteredText !== extractedText  // 필터링 여부
    }

    ocrCache.set(imageHash, {
      data: result,
      timestamp: Date.now()
    })

    console.log(`💾 [OCR Cache] Cached result for hash: ${imageHash} (cache size: ${ocrCache.size})`)

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ [OCR] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
