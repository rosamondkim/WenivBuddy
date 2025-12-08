import { NextResponse } from 'next/server'

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
            content: `당신은 에러 화면 및 코드 스크린샷에서 텍스트를 추출하는 전문가입니다.
이미지에서 보이는 모든 텍스트, 에러 메시지, 코드, 경로 등을 정확하게 추출해주세요.

추출 규칙:
1. 에러 메시지가 있다면 가장 먼저 추출
2. 코드는 들여쓰기를 유지하여 추출
3. 파일 경로, URL이 있다면 정확하게 추출
4. 줄 번호가 있다면 포함
5. 불필요한 UI 요소 (버튼 텍스트, 메뉴 등)는 제외

텍스트만 반환하고, 추가 설명은 하지 마세요.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '이 이미지에서 에러 메시지와 관련 코드/정보를 추출해주세요.'
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
        max_tokens: 2000,
        temperature: 0.1
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
    const extractedText = data.choices[0].message.content

    console.log(`✅ [OCR] Successfully extracted text (${extractedText.length} chars, ${data.usage.total_tokens} tokens)`)
    console.log(`📝 [OCR] Preview: ${extractedText.substring(0, 200)}...`)

    return NextResponse.json({
      text: extractedText,
      model: 'gpt-4o-mini',
      usage: data.usage,
      imageSize: imageFile.size,
      imageType: imageFile.type
    })

  } catch (error) {
    console.error('❌ [OCR] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
