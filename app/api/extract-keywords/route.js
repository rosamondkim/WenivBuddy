import { NextResponse } from 'next/server'

/**
 * OpenAI API를 사용한 키워드 추출 API 엔드포인트
 * POST /api/extract-keywords
 */
export async function POST(request) {
  try {
    const { question } = await request.json()

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid question parameter' },
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

    // OpenAI API 호출
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
            content: `당신은 개발 교육 분야의 키워드 추출 전문가입니다.
학생의 질문에서 기술적 키워드를 추출하고, 한글 용어는 영문 표준 용어로 변환하세요.
오타가 있다면 수정하고, 적절한 카테고리를 선택하세요.

카테고리 목록: Frontend, Backend, CSS, JavaScript, Git, 도구

응답은 반드시 다음 JSON 형식이어야 합니다:
{
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "category": "카테고리",
  "corrected_terms": {"원본용어": "수정된용어"}
}`
          },
          {
            role: 'user',
            content: `질문: "${question}"\n\n위 형식의 JSON으로 응답해주세요.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // OpenAI API 응답에서 결과 추출
    const content = data.choices[0].message.content
    const result = JSON.parse(content)

    return NextResponse.json({
      keywords: result.keywords || [],
      category: result.category || 'all',
      corrected_terms: result.corrected_terms || {},
      source: 'llm',
      model: 'gpt-4o-mini',
      usage: data.usage // 토큰 사용량 정보
    })

  } catch (error) {
    console.error('Error in extract-keywords API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
