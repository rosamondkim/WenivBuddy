import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * Q&A 데이터베이스에 새 답변 추가
 * POST /api/qna/add
 */
export async function POST(request) {
  try {
    const { question, answer, category, keywords } = await request.json()

    // 입력값 검증
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid question parameter' },
        { status: 400 }
      )
    }

    if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid answer parameter' },
        { status: 400 }
      )
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { error: 'Invalid category parameter' },
        { status: 400 }
      )
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid keywords parameter' },
        { status: 400 }
      )
    }

    // 데이터베이스 파일 경로
    const dbPath = path.join(process.cwd(), 'public', 'data', 'qna-database.json')

    // 기존 데이터 읽기
    let qnaData
    try {
      const fileContent = fs.readFileSync(dbPath, 'utf-8')
      qnaData = JSON.parse(fileContent)
    } catch (error) {
      console.error('❌ Failed to read QnA database:', error)
      return NextResponse.json(
        { error: 'Failed to read database file' },
        { status: 500 }
      )
    }

    // 새 ID 생성 (기존 최대 ID + 1)
    const existingIds = qnaData.qnaList.map(qna => {
      const match = qna.id.match(/qna-(\d+)/)
      return match ? parseInt(match[1]) : 0
    })
    const maxId = Math.max(...existingIds, 0)
    const newId = `qna-${String(maxId + 1).padStart(3, '0')}`

    // 새 Q&A 항목 생성
    const newQnA = {
      id: newId,
      category,
      question: question.trim(),
      keywords,
      answer: answer.trim(),
      author: 'AI 생성 (사용자 추가)',
      timestamp: new Date().toISOString(),
      views: 0
    }

    // 데이터베이스에 추가
    qnaData.qnaList.push(newQnA)

    // 파일에 저장
    try {
      fs.writeFileSync(dbPath, JSON.stringify(qnaData, null, 2), 'utf-8')
      console.log(`✅ [QnA Add] Successfully added new Q&A: ${newId}`)
    } catch (error) {
      console.error('❌ Failed to write QnA database:', error)
      return NextResponse.json(
        { error: 'Failed to save to database file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qna: newQnA,
      message: 'Q&A successfully added to database'
    })

  } catch (error) {
    console.error('❌ [QnA Add] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
