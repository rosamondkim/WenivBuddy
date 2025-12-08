import { NextResponse } from 'next/server'

/**
 * OpenAI API를 사용한 질문 답변 생성 API 엔드포인트
 * POST /api/generate-answer
 */
export async function POST(request) {
  try {
    const { question, category = 'all' } = await request.json()

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

    console.log(`🤖 [AI Answer] Generating answer for: "${question}"`)

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
            content: `당신은 위니브(Weniv) 부트캠프의 전문 강사 AI 어시스턴트입니다.
학생들의 기술 질문에 명확하고 이해하기 쉽게 답변해주세요.

답변 가이드라인:
1. 친절하고 격려하는 톤으로 답변하세요
2. 핵심 개념을 먼저 설명한 후 구체적인 예시를 제공하세요
3. 코드 예시가 필요한 경우 주석과 함께 제공하세요
4. 초보자도 이해할 수 있도록 전문 용어를 쉽게 풀어서 설명하세요
5. 관련된 공식 문서나 학습 자료를 추천해주세요
6. 실무에서의 활용 팁을 함께 제공하세요

카테고리별 전문 분야:
- Frontend: HTML, CSS, JavaScript, React, Vue 등
- Backend: Node.js, Express, 데이터베이스 등
- CSS: Flexbox, Grid, 애니메이션, 반응형 등
- JavaScript: ES6+, async/await, Promise 등
- Git: 버전 관리, 브랜치, 협업 등
- 도구: VSCode, Chrome DevTools 등

답변 형식:
- 명확한 구조 (개념 설명 → 예시 → 팁)
- 코드는 마크다운 코드 블록으로 감싸기
- 필요시 단계별 설명 (1, 2, 3...)
- 주의사항이나 흔한 실수 언급`
          },
          {
            role: 'user',
            content: category !== 'all'
              ? `[${category}] ${question}`
              : question
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [AI Answer] OpenAI API error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // OpenAI API 응답에서 결과 추출
    const answer = data.choices[0].message.content

    console.log(`✅ [AI Answer] Successfully generated answer (${data.usage.completion_tokens} tokens)`)

    return NextResponse.json({
      answer,
      model: 'gpt-4o-mini',
      usage: data.usage,
      category
    })

  } catch (error) {
    console.error('❌ [AI Answer] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
