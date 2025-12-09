import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

/**
 * 이미지 업로드 API
 * POST /api/upload-image
 */
export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // 파일 크기 검증 (최대 5MB)
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image size must be less than 5MB' },
        { status: 400 }
      )
    }

    // 파일 이름 생성 (랜덤 해시 + 타임스탬프 + 원본 확장자)
    const ext = path.extname(file.name)
    const randomHash = crypto.randomBytes(8).toString('hex')
    const timestamp = Date.now()
    const filename = `${timestamp}-${randomHash}${ext}`

    // 저장 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer())
    const filepath = path.join(uploadDir, filename)
    fs.writeFileSync(filepath, buffer)

    // 공개 URL 반환
    const publicUrl = `/uploads/${filename}`

    console.log(`✅ [Upload] Image uploaded: ${publicUrl} (${file.size} bytes)`)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size
    })

  } catch (error) {
    console.error('❌ [Upload] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
