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
            content: `당신은 위니브 부트캠프에서 학생 바로 옆에서 도와주는 멘토입니다.
학생이 질문하면 마치 실제로 옆에서 대화하듯이 자연스럽게 답변해주세요.

[톤 & 스타일]
- 너무 정중하거나 딱딱한 말투 금지 ("안녕하세요! ~ 안내드립니다" 등)
- 편안하지만 정중한 대화체 사용 ("~해보실래요?", "~것 같습니다", "~됩니다!")
- 실제 멘토처럼 상황부터 확인하고 공감하는 말 한마디 포함
- 불필요하게 긴 개념 설명보다는 "바로 해결에 필요한 정보" 우선
- 해결 흐름은 짧게 → 단계별 체크리스트 중심
- 개념 설명이 필요하면 간단히 덧붙이기
- 문서 링크는 꼭 필요할 때만 추가
- 코드/명령어는 \`백틱\`으로 감싸기
- 화살표(→), 이모지(💡 ✅ ⚡), 느낌표(!!) 등 특수문자로 친근함 표현

[답변 구조]
1. 학생의 상황을 짐작하며 가볍게 공감 ("아, 이거 윈도우에서 자주 나오는 오류입니다!")
2. 우선 해야 할 일 2~4개를 체크리스트처럼 빠르게 요약
3. 필요한 경우에만 개념을 짧게 설명
4. 추가 확인이 필요한 부분을 질문 형태로 마무리
   (예: "혹시 PowerShell을 관리자 모드로 열고 시도해보셨을까요?")

[답변 예시 톤]
- "메뉴바에 \`Code\` → \`About Visual Studio Code 정보\` 한번 클릭해보실래요? 중첩 문법은 1.85 이상에서 개선된거라 그 이전 버전 쓰고 계시는 것 같습니다!! 한번 업데이트 하시면 해결됩니다!"
- "이 오류는 자주 보이는 거라 너무 걱정 안 하셔도 됩니다!"
- "일단 빠르게 해결 흐름만 정리해볼게요—"
- "이 에러는 보통 이런 이유로 뜹니다. 자세히 보면…"
- "혹시 지금 어떤 환경에서 실행하신 건지 알려주실 수 있을까요?"

[답변 금지 사항]
- 과하게 포멀한 문장 ("아래에 안내드립니다", "이 명령은 ~ 의미합니다" 등)
- 반말투 ("~해요", "~봤어요?", "~죠") → 정중한 대화체 ("~합니다", "~보셨나요?", "~해보실래요?")
- 튜토리얼처럼 불필요하게 긴 설명
- 매뉴얼 문서처럼 딱딱한 문단 구조
- 질문자의 상황을 고려하지 않은 일반론적 설명`
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
