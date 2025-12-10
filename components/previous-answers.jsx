"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Copy,
  CheckCheck,
  User,
  Clock,
  Loader2,
} from "lucide-react";

export function PreviousAnswers({
  searchQuery,
  selectedCategory = "all",
  uploadedImage = null,
  onExtractionInfoChange,
  onOCRTextExtracted,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showOCRId, setShowOCRId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState([]);
  const [extractionInfo, setExtractionInfo] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrExtractedText, setOcrExtractedText] = useState(null);

  // 검색 실행
  useEffect(() => {
    if (!searchQuery && !uploadedImage) {
      setSearchResults([]);
      setExtractedKeywords([]);
      setExtractionInfo(null);
      return;
    }

    setIsLoading(true);

    // 서버 사이드 검색 수행
    const performSearch = async () => {
      let finalQuery = searchQuery;

      // 이미지가 있으면 먼저 OCR 처리
      if (uploadedImage) {
        setIsProcessingOCR(true);

        try {
          console.log("🖼️ [OCR] Processing uploaded image...");

          const formData = new FormData();
          formData.append("image", uploadedImage);

          const response = await fetch("/api/ocr", {
            method: "POST",
            body: formData,
            cache: "no-store",
          });

          if (response.ok) {
            const data = await response.json();

            // Hallucination 감지 확인
            if (data.note && data.note.includes("hallucination")) {
              console.warn(
                "⚠️ [OCR] Hallucination detected - no text extracted from image"
              );
              setOcrExtractedText("[이미지에서 텍스트를 추출할 수 없습니다]");
              if (onOCRTextExtracted) {
                onOCRTextExtracted("[이미지에서 텍스트를 추출할 수 없습니다]");
              }
            } else if (data.text) {
              console.log(
                "✅ [OCR] Text extracted for search:",
                data.text.substring(0, 100) + "..."
              );

              // 추출된 텍스트를 질문에 추가
              finalQuery = searchQuery
                ? `${searchQuery}\n\n[이미지에서 추출된 텍스트]\n${data.text}`
                : data.text;

              // OCR 텍스트 저장 및 부모 컴포넌트에 전달
              setOcrExtractedText(data.text);
              if (onOCRTextExtracted) {
                onOCRTextExtracted(data.text);
              }
            } else {
              console.warn("⚠️ [OCR] No text found in image");
              setOcrExtractedText("[이미지에서 텍스트를 찾을 수 없습니다]");
              if (onOCRTextExtracted) {
                onOCRTextExtracted("[이미지에서 텍스트를 찾을 수 없습니다]");
              }
            }
          } else {
            console.error("❌ [OCR] Failed to extract text from image");
            setOcrExtractedText("[이미지 처리 중 오류가 발생했습니다]");
            if (onOCRTextExtracted) {
              onOCRTextExtracted("[이미지 처리 중 오류가 발생했습니다]");
            }
          }
        } catch (error) {
          console.error("❌ [OCR] Error:", error);
        } finally {
          setIsProcessingOCR(false);
        }
      }

      // 검색어가 비어있으면 검색 건너뛰기
      if (!finalQuery || finalQuery.trim().length === 0) {
        console.warn("⚠️ [Search] Empty query - skipping search");
        setSearchResults([]);
        setExtractionInfo(null);
        if (onExtractionInfoChange) {
          onExtractionInfoChange(null);
        }
        setIsLoading(false);
        return;
      }

      console.log(`🔍 [Search] Calling API with query length: ${finalQuery.length}, isOCR: ${uploadedImage !== null}`);
      console.log(`📝 [Search] Query preview: ${finalQuery.substring(0, 100)}...`);

      // 서버 사이드 검색 API 호출
      try {
        const response = await fetch("/api/qna/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: finalQuery,
            category: selectedCategory,
            maxResults: 3,
            isOCR: uploadedImage !== null, // 이미지가 있으면 OCR 모드
          }),
          cache: "no-store",
        });

        console.log(`📡 [Search] API response status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const searchResult = await response.json();

        console.log(`✅ [Search] Got ${searchResult.results?.length || 0} results`);
        if (searchResult.results && searchResult.results.length > 0) {
          console.log(`📋 [Search] Top result: ${searchResult.results[0].id} (score: ${searchResult.results[0].score?.toFixed(3)})`);
        }

        // 추출 정보 저장
        if (searchResult.extractionInfo) {
          setExtractedKeywords(searchResult.extractionInfo.keywords || []);
          setExtractionInfo(searchResult.extractionInfo);

          // 부모 컴포넌트에 추출 정보 전달
          if (onExtractionInfoChange) {
            onExtractionInfoChange(searchResult.extractionInfo);
          }

          // 추가 정보를 상태로 저장 (신뢰도 표시용)
          setSearchResults(searchResult.results || []);
        } else {
          setSearchResults(searchResult.results || []);
          setExtractionInfo(null);

          if (onExtractionInfoChange) {
            onExtractionInfoChange(null);
          }
        }
      } catch (error) {
        console.error("❌ [Search] Error:", error);
        setSearchResults([]);
        setExtractionInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [
    searchQuery,
    uploadedImage,
    selectedCategory,
    onExtractionInfoChange,
    onOCRTextExtracted,
  ]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = async (answer) => {
    await navigator.clipboard.writeText(answer.answer);
    setCopiedId(answer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 마크다운 이미지를 파싱하여 텍스트와 이미지 배열로 변환
  const parseAnswerWithImages = (text) => {
    if (!text) return [];

    const parts = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(text)) !== null) {
      // 이미지 앞의 텍스트 추가
      if (match.index > lastIndex) {
        const textContent = text.substring(lastIndex, match.index).trim();
        if (textContent) {
          parts.push({ type: "text", content: textContent });
        }
      }

      // 이미지 추가
      parts.push({
        type: "image",
        alt: match[1] || "이미지",
        url: match[2],
      });

      lastIndex = match.index + match[0].length;
    }

    // 마지막 텍스트 추가
    if (lastIndex < text.length) {
      const textContent = text.substring(lastIndex).trim();
      if (textContent) {
        parts.push({ type: "text", content: textContent });
      }
    }

    return parts.length > 0 ? parts : [{ type: "text", content: text }];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-balance mb-2">
              {"이전 답변"}
              <Badge variant="secondary">{searchResults.length}</Badge>
            </CardTitle>

            {/* 추출된 키워드 */}
            {extractedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">키워드:</span>
                {extractedKeywords.slice(0, 5).map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {extractedKeywords.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{extractedKeywords.length - 5}
                  </Badge>
                )}
              </div>
            )}

            {/* OCR 텍스트 표시 */}
            {ocrExtractedText && (
              <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-start gap-2 mb-2">
                  <ImageIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-card-foreground mb-1">
                      이미지에서 추출된 텍스트:
                    </p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                      {ocrExtractedText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            {isProcessingOCR ? (
              <div className="text-center">
                <p className="text-sm font-medium text-card-foreground">
                  이미지에서 텍스트 추출 중...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  잠시만 기다려주세요
                </p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">검색 중...</span>
            )}
          </div>
        )}

        {!isLoading &&
          searchResults.length === 0 &&
          (searchQuery || uploadedImage) && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </p>
            </div>
          )}

        {!isLoading &&
          searchResults.length === 0 &&
          !searchQuery &&
          !uploadedImage && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                질문을 입력하거나 이미지를 붙여넣으면 유사한 이전 답변을
                찾아드립니다.
              </p>
            </div>
          )}

        {!isLoading &&
          searchResults.map((answer) => {
            const isExpanded = expandedId === answer.id;
            const isCopied = copiedId === answer.id;
            const showOCR = showOCRId === answer.id;

            return (
              <div
                key={answer.id}
                className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5"
              >
                {/* 헤더: 카테고리 + 태그 + 메타 정보 */}
                <div className="mb-2">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {answer.category}
                    </Badge>
                    {answer.tags &&
                      answer.tags.slice(0, 3).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    {answer.tags && answer.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{answer.tags.length - 3}
                      </Badge>
                    )}
                    {answer.score && (
                      <Badge
                        variant="default"
                        className="text-xs bg-primary/10 text-primary"
                      >
                        유사도 {Math.round(answer.score * 100)}%
                      </Badge>
                    )}
                  </div>

                  {/* 제목 */}
                  <h4 className="font-semibold text-card-foreground text-balance mb-2">
                    {answer.title}
                  </h4>

                  {/* 본문 요약 (접힌 상태) */}
                  {!isExpanded && answer.body && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                      {answer.body}
                    </p>
                  )}

                  {/* OCR 에러 라인 (접힌 상태) */}
                  {!isExpanded && answer.ocrErrorLine && (
                    <p className="text-xs text-muted-foreground/70 italic line-clamp-1 mt-1">
                      💡 {answer.ocrErrorLine}
                    </p>
                  )}
                </div>

                {/* 펼친 상태: 전체 내용 표시 */}
                {isExpanded && (
                  <div className="mb-3 space-y-3">
                    {/* 본문 */}
                    {answer.body && (
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-sm font-medium text-card-foreground mb-1">
                          질문
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {answer.body}
                        </p>
                      </div>
                    )}

                    {/* 질문 이미지 */}
                    {answer.imageUrl && (
                      <div className="overflow-hidden rounded-md border border-border">
                        <img
                          src={answer.imageUrl}
                          alt="질문 이미지"
                          className="h-auto w-full max-w-md mx-auto"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* OCR 텍스트 토글 */}
                    {answer.ocrText && (
                      <div className="rounded-lg border border-border">
                        <button
                          onClick={() =>
                            setShowOCRId(showOCR ? null : answer.id)
                          }
                          className="w-full flex items-center justify-between p-3 hover:bg-accent/5 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            <ImageIcon className="h-4 w-4" />
                            이미지에서 추출된 텍스트
                          </span>
                          {showOCR ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {showOCR && (
                          <div className="p-3 pt-0">
                            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">
                              {answer.ocrText}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 답변 */}
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-sm font-medium text-card-foreground mb-2">
                        답변
                      </p>
                      <div className="space-y-3">
                        {parseAnswerWithImages(answer.answer).map(
                          (part, idx) => {
                            if (part.type === "text") {
                              return (
                                <p
                                  key={idx}
                                  className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap"
                                >
                                  {part.content}
                                </p>
                              );
                            } else if (part.type === "image") {
                              // 답변 본문에 이미지가 이미 표시되므로 하단에 중복 표시하지 않음
                              return (
                                <div
                                  key={idx}
                                  className="overflow-hidden rounded-md border border-border"
                                >
                                  <img
                                    src={part.url}
                                    alt={part.alt}
                                    className="h-auto w-1/2 mx-auto"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                </div>
                              );
                            }
                            return null;
                          }
                        )}
                      </div>
                    </div>

                    {/* 메타 정보 */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(answer.timestamp)}
                      </span>
                      {answer.author && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {answer.author}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(answer.id)}
                    className="gap-1.5 text-xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        {"접기"}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        {"더보기"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(answer)}
                    className="gap-1.5 text-xs"
                  >
                    {isCopied ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5" />
                        {"복사됨"}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {"복사"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
