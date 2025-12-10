import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { filterOCRText, extractTitleFromFilteredText } from "@/lib/ocr-text-filter";

export const dynamic = "force-dynamic";

/**
 * 마크다운 이미지 제거 (제목 생성용)
 */
function removeMarkdownImages(text) {
  if (!text) return "";
  // 마크다운 이미지 패턴 제거: ![alt](url) 또는 ![alt](url "title")
  return text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "").trim();
}

/**
 * 텍스트에서 의미있는 첫 문장 추출
 */
function extractFirstMeaningfulText(text, maxLength = 100) {
  if (!text) return "";

  // 마크다운 이미지 제거
  let cleanText = removeMarkdownImages(text);

  // 코드 블록 마커 제거
  cleanText = cleanText
    .replace(/^```[\w]*\n?/gm, "") // 시작 마커
    .replace(/\n?```$/gm, "") // 끝 마커
    .trim();

  // 빈 문자열이면 "[이미지 포함]" 반환
  if (!cleanText.trim()) {
    return "[이미지 포함]";
  }

  // 의미있는 첫 줄 찾기 (빈 줄과 특수문자만 있는 줄 제외)
  const lines = cleanText.split("\n");
  let firstLine = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    // 빈 줄, 특수문자만, 너무 짧은 줄 제외
    if (
      trimmedLine.length > 2 &&
      !/^[`!@#$%^&*()_+=\-\[\]{}|\\:;"'<>,.?/~]*$/.test(trimmedLine)
    ) {
      firstLine = trimmedLine;
      break;
    }
  }

  if (!firstLine) {
    return "[이미지 포함]";
  }

  // 너무 길면 자르기
  if (firstLine.length > maxLength) {
    return firstLine.substring(0, maxLength).trim() + "...";
  }

  return firstLine;
}

/**
 * OCR 텍스트에서 가장 중요한 에러 메시지나 의미있는 텍스트 추출
 */
function extractMostImportantText(ocrText) {
  if (!ocrText) return null;

  const lines = ocrText.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

  // 에러 메시지 패턴 (우선순위 높음)
  const errorPatterns = [
    /인식되지 않습니다/i,
    /오류/i,
    /error/i,
    /에러/i,
    /실행할 수 없/i,
    /찾을 수 없/i,
    /실패/i,
    /실행되지 않/i,
    /명령을 찾을 수 없/i,
    /명령어를 찾을 수 없/i,
  ];

  // 프롬프트/경로 패턴 (제외 대상)
  const promptPatterns = [
    /^PS\s+/i, // PowerShell 프롬프트
    /^[A-Z]:\\/, // Windows 경로 (C:\ 등)
    /^[~$]/, // Unix 프롬프트
    /^>\s*$/, // 단순 프롬프트
    /^[A-Z]:\\Users\\/, // 사용자 경로
    /^```/, // 코드 블록 마커
  ];

  // 파일명 패턴 (제외 대상)
  const filenamePatterns = [
    /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i, // 이미지 파일
    /\.(js|jsx|ts|tsx|css|scss|html|json|xml)$/i, // 코드 파일
    /placeholder/i, // placeholder 파일명
  ];

  // 1순위: 에러 메시지가 포함된 줄 찾기
  for (const line of lines) {
    // 프롬프트/경로는 제외
    if (promptPatterns.some((pattern) => pattern.test(line))) {
      continue;
    }

    // 에러 메시지 패턴이 있으면 우선 사용
    if (errorPatterns.some((pattern) => pattern.test(line))) {
      return line.length > 100 ? line.substring(0, 100) + "..." : line;
    }
  }

  // 2순위: 프롬프트/경로가 아닌 첫 번째 의미있는 줄
  for (const line of lines) {
    // 프롬프트/경로는 제외
    if (promptPatterns.some((pattern) => pattern.test(line))) {
      continue;
    }

    // 파일명 패턴 제외
    if (filenamePatterns.some((pattern) => pattern.test(line))) {
      continue;
    }

    // 특수문자만 있는 줄 제외
    if (!/^[`!@#$%^&*()_+=\-\[\]{}|\\:;"'<>,.?/~]*$/.test(line) && line.length > 10) {
      return line.length > 100 ? line.substring(0, 100) + "..." : line;
    }
  }

  // 3순위: 첫 번째 줄 (프롬프트여도 사용)
  if (lines.length > 0) {
    const firstLine = lines[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + "..." : firstLine;
  }

  return null;
}

/**
 * title 자동 생성
 */
function generateTitle(body, ocrErrorLine, ocrText = null) {
  // body에서 마크다운 이미지만 있는지 확인
  const bodyWithoutImages = removeMarkdownImages(body).trim();
  const isBodyOnlyImages = !bodyWithoutImages || bodyWithoutImages.length === 0;

  // 1순위: body에 텍스트가 있으면 body 우선 사용
  if (!isBodyOnlyImages) {
    const titleText = extractFirstMeaningfulText(body, 100);
    if (titleText && titleText !== "[이미지 포함]") {
      return titleText;
    }
  }

  // 2순위: OCR 텍스트에서 가장 중요한 텍스트 추출
  const importantOcrText = ocrText ? extractMostImportantText(ocrText) : null;

  // OCR 에러 라인이 있으면 확인 (코드 블록 마커나 파일명 제외)
  if (ocrErrorLine) {
    // ocrErrorLine이 무의미한 패턴인지 확인
    const isInvalidPattern = /^PS\s+|^[A-Z]:\\|^[~$]|^>\s*$|^```/.test(ocrErrorLine.trim());
    const isFilename = /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|js|jsx|ts|tsx|css|scss|html|json|xml)$/i.test(ocrErrorLine.trim());

    // 의미있는 에러 라인이면 사용
    if (!isInvalidPattern && !isFilename && ocrErrorLine.length > 10) {
      return ocrErrorLine.length > 100
        ? ocrErrorLine.substring(0, 100) + "..."
        : ocrErrorLine;
    }
  }

  // 3순위: OCR에서 추출한 중요한 텍스트 사용
  if (importantOcrText) {
    return importantOcrText;
  }

  // 4순위: body가 이미지만 있으면 기본값
  return "[이미지 포함]";
}

/**
 * 카테고리에서 키워드 추출
 * 검색 시 카테고리 이름으로도 찾을 수 있도록
 */
function getCategoryKeywords(category) {
  const categoryMap = {
    "Front-end": ["Frontend", "Front-end"],
    "Back-end": ["Backend", "Back-end"],
    "VSC": ["VSC", "VSCode"],
    "Git/GitHub": ["Git", "GitHub"],
    "Terminal": ["Terminal", "터미널"],
    "Node": ["Node", "Node.js", "nodejs"],
    "Figma": ["Figma"],
    "기타": []
  };

  return categoryMap[category] || [category];
}

/**
 * tags 자동 생성
 */
function generateTags(ocrText, keywords, category) {
  const tags = [];

  // OCR 텍스트에서 파일명 제거 (노이즈 제거)
  let cleanedOcrText = ocrText || "";
  if (cleanedOcrText) {
    // 파일명 패턴 제거
    cleanedOcrText = cleanedOcrText
      .replace(/[\w-]+\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|js|jsx|ts|tsx|css|scss|html|json|xml)/gi, '')
      .replace(/placeholder[\w-]*/gi, '');
  }

  const combinedText = `${cleanedOcrText} ${keywords.join(" ")}`.toLowerCase();

  if (/c:\\|ps |windows|powershell/i.test(combinedText)) tags.push("Windows");
  if (/powershell|ps1/i.test(combinedText)) tags.push("PowerShell");
  if (/\bnpm\b/i.test(combinedText)) tags.push("npm");
  if (/\bnode\b|nodejs/i.test(combinedText)) tags.push("Node.js");
  if (/\breact\b/i.test(combinedText)) tags.push("React");
  if (/\bgit\b/i.test(combinedText)) tags.push("Git");
  if (/\bcss\b|flexbox|grid/i.test(combinedText)) tags.push("CSS");
  if (/vscode|vs code|visual studio code/i.test(combinedText))
    tags.push("VSCode");
  if (/express/i.test(combinedText)) tags.push("Express");

  if (tags.length === 0 && category) tags.push(category);

  return [...new Set(tags)];
}

/**
 * Q&A 데이터베이스에 새 답변 추가
 * POST /api/qna/add
 */
export async function POST(request) {
  try {
    const {
      question,
      answer,
      category,
      author = "익명",
      keywords,
      ocrText = null,
      imageUrl = null,
    } = await request.json();

    // 입력값 검증
    if (
      !question ||
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid question parameter" },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid answer parameter" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string") {
      return NextResponse.json(
        { error: "Invalid category parameter" },
        { status: 400 }
      );
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Invalid keywords parameter" },
        { status: 400 }
      );
    }

    // 데이터베이스 파일 경로
    const dbPath = path.join(
      process.cwd(),
      "public",
      "data",
      "qna-database.json"
    );

    // 기존 데이터 읽기
    let qnaData;
    try {
      const fileContent = fs.readFileSync(dbPath, "utf-8");
      qnaData = JSON.parse(fileContent);
    } catch (error) {
      console.error("❌ Failed to read QnA database:", error);
      return NextResponse.json(
        { error: "Failed to read database file" },
        { status: 500 }
      );
    }

    // 새 ID 생성 (기존 최대 ID + 1)
    const existingIds = qnaData.qnaList.map((qna) => {
      const match = qna.id.match(/qna-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    const maxId = Math.max(...existingIds, 0);
    const newId = `qna-${String(maxId + 1).padStart(3, "0")}`;

    // body와 ocrText 분리
    const body = question.trim();
    let ocrTextTrimmed = ocrText ? ocrText.trim() : null;

    // OCR 텍스트 정제 (터미널 프롬프트, 경로 등 제거)
    if (ocrTextTrimmed) {
      const filteredOcrText = filterOCRText(ocrTextTrimmed);
      if (filteredOcrText && filteredOcrText !== ocrTextTrimmed) {
        console.log(`🔧 [QnA Add] OCR text filtered: ${ocrTextTrimmed.length} → ${filteredOcrText.length} chars`);
        ocrTextTrimmed = filteredOcrText;
      }
    }

    const ocrErrorLine = ocrTextTrimmed
      ? ocrTextTrimmed.split("\n")[0].trim()
      : null;

    // title 자동 생성
    let title;
    // body에 텍스트가 있으면 body 사용
    const bodyWithoutImages = removeMarkdownImages(body).trim();
    if (bodyWithoutImages && bodyWithoutImages.length > 0) {
      title = extractFirstMeaningfulText(body, 100);
    }
    // body가 이미지만 있고 OCR 텍스트가 있으면 OCR에서 제목 추출
    else if (ocrTextTrimmed) {
      title = extractTitleFromFilteredText(ocrTextTrimmed, 80);
    }
    // 둘 다 없으면 기본값
    else {
      title = "[이미지 포함]";
    }

    const tags = generateTags(ocrTextTrimmed, keywords, category);

    // 카테고리를 키워드에 추가 (검색 정확도 향상)
    const categoryKeywords = getCategoryKeywords(category);
    const finalKeywords = [...new Set([...categoryKeywords, ...keywords])]; // 중복 제거

    console.log(`🏷️ [QnA Add] Category keywords added: [${categoryKeywords.join(', ')}]`);
    console.log(`🔑 [QnA Add] Final keywords: [${finalKeywords.join(', ')}]`);

    // 새 Q&A 항목 생성 (새 스키마)
    const newQnA = {
      id: newId,
      category,
      title,
      body,
      ocrText: ocrTextTrimmed,
      ocrErrorLine,
      tags,
      keywords: finalKeywords,
      answer: answer.trim(),
      author: author.trim() || "익명",
      timestamp: new Date().toISOString(),
      views: 0,
      imageUrl: imageUrl || null, // 질문 이미지 URL 추가
    };

    // 데이터베이스에 추가
    qnaData.qnaList.push(newQnA);

    // 파일에 저장
    try {
      fs.writeFileSync(dbPath, JSON.stringify(qnaData, null, 2), "utf-8");
      console.log(`✅ [QnA Add] Successfully added new Q&A: ${newId}`);
    } catch (error) {
      console.error("❌ Failed to write QnA database:", error);
      return NextResponse.json(
        { error: "Failed to save to database file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      qna: newQnA,
      message: "Q&A successfully added to database",
    });
  } catch (error) {
    console.error("❌ [QnA Add] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
