import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * title 자동 생성
 */
function generateTitle(body, ocrErrorLine) {
  if (ocrErrorLine) {
    const bodyShort = body.length > 30 ? body.substring(0, 30) + '...' : body
    const errorShort = ocrErrorLine.length > 50 ? ocrErrorLine.substring(0, 50) + '...' : ocrErrorLine
    return `${bodyShort} - ${errorShort}`
  }
  return body.length > 100 ? body.substring(0, 100) + '...' : body
}

/**
 * tags 자동 생성
 */
function generateTags(ocrText, keywords, category) {
  const tags = []
  const combinedText = `${ocrText || ''} ${keywords.join(' ')}`.toLowerCase()

  if (/c:\\|ps |windows|powershell/i.test(combinedText)) tags.push('Windows')
  if (/powershell|ps1/i.test(combinedText)) tags.push('PowerShell')
  if (/\bnpm\b/i.test(combinedText)) tags.push('npm')
  if (/\bnode\b|nodejs/i.test(combinedText)) tags.push('Node.js')
  if (/\breact\b/i.test(combinedText)) tags.push('React')
  if (/\bgit\b/i.test(combinedText)) tags.push('Git')
  if (/\bcss\b|flexbox|grid/i.test(combinedText)) tags.push('CSS')
  if (/vscode|vs code|visual studio code/i.test(combinedText)) tags.push('VSCode')
  if (/express/i.test(combinedText)) tags.push('Express')

  if (tags.length === 0 && category) tags.push(category)

  return [...new Set(tags)]
}

/**
 * Q&A 데이터베이스에 새 답변 추가
 * POST /api/qna/add
 */
export async function POST(request) {
  try {
    const { question, answer, category, author = '익명', keywords, ocrText = null } = await request.json()

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

    // body와 ocrText 분리
    const body = question.trim()
    const ocrTextTrimmed = ocrText ? ocrText.trim() : null
    const ocrErrorLine = ocrTextTrimmed ? ocrTextTrimmed.split('\n')[0].trim() : null

    // title과 tags 자동 생성
    const title = generateTitle(body, ocrErrorLine)
    const tags = generateTags(ocrTextTrimmed, keywords, category)

    // 새 Q&A 항목 생성 (새 스키마)
    const newQnA = {
      id: newId,
      category,
      title,
      body,
      ocrText: ocrTextTrimmed,
      ocrErrorLine,
      tags,
      keywords,
      answer: answer.trim(),
      author: author.trim() || '익명',
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
