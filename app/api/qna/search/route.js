import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { searchQnA } from '@/lib/qna-search'

export const dynamic = 'force-dynamic'

/**
 * Q&A 검색 API
 * POST /api/qna/search
 * 
 * 요청 본문:
 * {
 *   "query": "검색어",
 *   "category": "all" | "Frontend" | "Backend" | ...,
 *   "maxResults": 3 (선택, 기본값: 3),
 *   "minSimilarity": 0.15 (선택, 기본값: 0.15)
 * }
 */
export async function POST(request) {
  try {
    const { query, category = 'all', maxResults = 3, minSimilarity = 0.7, isOCR = false } = await request.json()

    // 입력값 검증
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid query parameter' },
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
      console.error('❌ [QnA Search] Failed to read database:', error)
      return NextResponse.json(
        { error: 'Failed to read database file' },
        { status: 500 }
      )
    }

    const qnaList = qnaData.qnaList || []

    // 검색 수행
    const searchResult = await searchQnA(
      qnaList,
      query.trim(),
      category,
      maxResults,
      minSimilarity,
      isOCR
    )

    console.log(`✅ [QnA Search] Found ${searchResult.results.length} results for: "${query.substring(0, 50)}..."`)

    return NextResponse.json(searchResult)

  } catch (error) {
    console.error('❌ [QnA Search] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}





