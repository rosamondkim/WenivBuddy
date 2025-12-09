const fs = require('fs')
const path = require('path')

/**
 * Q&A 데이터 마이그레이션 스크립트
 * 기존 question 필드를 title, body, ocrText, ocrErrorLine으로 분리
 */

// 파일 경로
const inputPath = path.join(__dirname, '../public/data/qna-database.json')
const outputPath = path.join(__dirname, '../public/data/qna-database.v2.json')
const backupPath = path.join(__dirname, '../public/data/qna-database.backup.json')

/**
 * question 문자열을 파싱하여 body, ocrText, ocrErrorLine 추출
 */
function parseQuestion(question) {
  const separator = '\n\n[이미지에서 추출된 텍스트]\n'

  if (question.includes(separator)) {
    const [body, ocrPart] = question.split(separator)

    // OCR 텍스트에서 코드블록 제거 (```로 감싸진 부분 추출)
    let ocrText = ocrPart
    const codeBlockMatch = ocrPart.match(/```[\s\S]*?```/)
    if (codeBlockMatch) {
      ocrText = codeBlockMatch[0].replace(/```\n?/g, '').trim()
    }

    // 첫 번째 줄을 대표 에러로 추출
    const ocrErrorLine = ocrText.split('\n')[0].trim()

    return {
      body: body.trim(),
      ocrText: ocrText.trim(),
      ocrErrorLine
    }
  }

  // OCR 텍스트가 없는 경우
  return {
    body: question.trim(),
    ocrText: null,
    ocrErrorLine: null
  }
}

/**
 * title 자동 생성
 */
function generateTitle(body, ocrErrorLine, category) {
  if (ocrErrorLine) {
    // body와 ocrErrorLine을 조합
    const bodyShort = body.length > 30 ? body.substring(0, 30) + '...' : body
    const errorShort = ocrErrorLine.length > 50 ? ocrErrorLine.substring(0, 50) + '...' : ocrErrorLine
    return `${bodyShort} - ${errorShort}`
  }

  // OCR이 없으면 body를 title로 사용 (최대 100자)
  return body.length > 100 ? body.substring(0, 100) + '...' : body
}

/**
 * tags 자동 생성
 */
function generateTags(ocrText, keywords, category) {
  const tags = []
  const combinedText = `${ocrText || ''} ${keywords.join(' ')}`.toLowerCase()

  // Windows 관련
  if (/c:\\|ps |windows|powershell/i.test(combinedText)) {
    tags.push('Windows')
  }

  // PowerShell
  if (/powershell|ps1/i.test(combinedText)) {
    tags.push('PowerShell')
  }

  // npm
  if (/\bnpm\b/i.test(combinedText)) {
    tags.push('npm')
  }

  // Node.js
  if (/\bnode\b|nodejs/i.test(combinedText)) {
    tags.push('Node.js')
  }

  // React
  if (/\breact\b/i.test(combinedText)) {
    tags.push('React')
  }

  // Git
  if (/\bgit\b/i.test(combinedText)) {
    tags.push('Git')
  }

  // CSS
  if (/\bcss\b|flexbox|grid/i.test(combinedText)) {
    tags.push('CSS')
  }

  // VSCode
  if (/vscode|vs code|visual studio code/i.test(combinedText)) {
    tags.push('VSCode')
  }

  // Express
  if (/express/i.test(combinedText)) {
    tags.push('Express')
  }

  // 태그가 없으면 카테고리를 태그로 추가
  if (tags.length === 0 && category) {
    tags.push(category)
  }

  // 중복 제거
  return [...new Set(tags)]
}

/**
 * 마이그레이션 수행
 */
function migrateData() {
  console.log('📦 Q&A 데이터 마이그레이션 시작...\n')

  // 1. 기존 데이터 읽기
  console.log('1️⃣ 기존 데이터 읽기:', inputPath)
  const rawData = fs.readFileSync(inputPath, 'utf-8')
  const data = JSON.parse(rawData)
  const oldQnaList = data.qnaList || []
  console.log(`   ✓ ${oldQnaList.length}개 항목 발견\n`)

  // 2. 백업 생성
  console.log('2️⃣ 백업 파일 생성:', backupPath)
  fs.writeFileSync(backupPath, rawData, 'utf-8')
  console.log('   ✓ 백업 완료\n')

  // 3. 데이터 변환
  console.log('3️⃣ 데이터 변환 중...')
  const newQnaList = oldQnaList.map((item, index) => {
    const { body, ocrText, ocrErrorLine } = parseQuestion(item.question)
    const title = generateTitle(body, ocrErrorLine, item.category)
    const tags = generateTags(ocrText, item.keywords, item.category)

    console.log(`   [${index + 1}/${oldQnaList.length}] ${item.id}`)
    console.log(`       Title: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`)
    console.log(`       Tags: ${tags.join(', ')}`)
    console.log(`       OCR: ${ocrText ? 'Yes' : 'No'}`)

    return {
      id: item.id,
      category: item.category,
      title,
      body,
      ocrText,
      ocrErrorLine,
      tags,
      keywords: item.keywords, // 검색용으로 유지
      answer: item.answer,
      author: item.author,
      timestamp: item.timestamp,
      views: item.views || 0,
      ...(item.imageUrl && { imageUrl: item.imageUrl }) // imageUrl이 있으면 포함
    }
  })
  console.log('   ✓ 변환 완료\n')

  // 4. 새 파일로 저장
  console.log('4️⃣ 새 파일 저장:', outputPath)
  const newData = {
    qnaList: newQnaList
  }
  fs.writeFileSync(outputPath, JSON.stringify(newData, null, 2), 'utf-8')
  console.log('   ✓ 저장 완료\n')

  console.log('✅ 마이그레이션 완료!')
  console.log(`\n📊 통계:`)
  console.log(`   - 총 항목 수: ${newQnaList.length}`)
  console.log(`   - OCR 텍스트 포함: ${newQnaList.filter(q => q.ocrText).length}`)
  console.log(`   - 평균 태그 수: ${(newQnaList.reduce((sum, q) => sum + q.tags.length, 0) / newQnaList.length).toFixed(1)}`)
  console.log(`\n📁 파일 위치:`)
  console.log(`   - 백업: ${backupPath}`)
  console.log(`   - 신규: ${outputPath}`)
  console.log(`\n💡 다음 단계:`)
  console.log(`   1. ${outputPath} 파일을 확인하세요`)
  console.log(`   2. 문제가 없으면 ${inputPath}로 복사하세요`)
  console.log(`   3. 코드에서 새 스키마를 사용하도록 수정하세요`)
}

// 스크립트 실행
try {
  migrateData()
} catch (error) {
  console.error('❌ 마이그레이션 실패:', error)
  process.exit(1)
}
