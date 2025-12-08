"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, ImageIcon, Copy, CheckCheck, User, Clock, Loader2 } from "lucide-react"
import { searchQnA, loadQnADatabase } from "@/lib/qna-search"
import { extractKeywords } from "@/lib/keyword-extractor"

export function PreviousAnswers({ searchQuery, selectedCategory = "all", uploadedImage = null, onExtractionInfoChange, onOCRTextExtracted }) {
  const [expandedId, setExpandedId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [qnaDatabase, setQnaDatabase] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [extractedKeywords, setExtractedKeywords] = useState([])
  const [extractionInfo, setExtractionInfo] = useState(null)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrExtractedText, setOcrExtractedText] = useState(null)

  // Q&A 데이터베이스 로드
  useEffect(() => {
    const loadData = async () => {
      const data = await loadQnADatabase()
      setQnaDatabase(data)
    }
    loadData()
  }, [])

  // 검색 실행
  useEffect(() => {
    if ((!searchQuery && !uploadedImage) || !qnaDatabase.length) {
      setSearchResults([])
      setExtractedKeywords([])
      return
    }

    setIsLoading(true)

    // 하이브리드 검색 수행
    const performSearch = async () => {
      let finalQuery = searchQuery

      // 이미지가 있으면 먼저 OCR 처리
      if (uploadedImage) {
        setIsProcessingOCR(true)

        try {
          console.log('🖼️ [OCR] Processing uploaded image...')

          const formData = new FormData()
          formData.append('image', uploadedImage)

          const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const data = await response.json()
            console.log('✅ [OCR] Text extracted for search:', data.text.substring(0, 100) + '...')

            // 추출된 텍스트를 질문에 추가
            if (data.text) {
              finalQuery = searchQuery
                ? `${searchQuery}\n\n[이미지에서 추출된 텍스트]\n${data.text}`
                : data.text

              // OCR 텍스트 저장 및 부모 컴포넌트에 전달
              setOcrExtractedText(data.text)
              if (onOCRTextExtracted) {
                onOCRTextExtracted(data.text)
              }
            }
          } else {
            console.error('❌ [OCR] Failed to extract text from image')
          }
        } catch (error) {
          console.error('❌ [OCR] Error:', error)
        } finally {
          setIsProcessingOCR(false)
        }
      }

      const searchResult = await searchQnA(qnaDatabase, finalQuery, selectedCategory, 3)

      // 추출 정보 저장
      if (searchResult.extractionInfo) {
        setExtractedKeywords(searchResult.extractionInfo.keywords || [])
        setExtractionInfo(searchResult.extractionInfo)

        // 부모 컴포넌트에 추출 정보 전달
        if (onExtractionInfoChange) {
          onExtractionInfoChange(searchResult.extractionInfo)
        }

        // 추가 정보를 상태로 저장 (신뢰도 표시용)
        setSearchResults(searchResult.results || [])
      } else {
        setSearchResults(searchResult.results || [])
        setExtractionInfo(null)

        if (onExtractionInfoChange) {
          onExtractionInfoChange(null)
        }
      }

      setIsLoading(false)
    }

    performSearch()
  }, [searchQuery, uploadedImage, qnaDatabase, selectedCategory, onExtractionInfoChange])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const copyToClipboard = async (answer) => {
    await navigator.clipboard.writeText(answer.answer)
    setCopiedId(answer.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-balance mb-2">
              {"이전 답변"}
              <Badge variant="secondary">{searchResults.length}</Badge>
            </CardTitle>

            {/* 추출 정보 표시 */}
            {extractionInfo && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {/* 추출 방법 뱃지 */}
                <Badge
                  variant={extractionInfo.source === 'llm' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {extractionInfo.source === 'llm' ? '🤖 AI 분석' : '⚡ 로컬 분석'}
                </Badge>

                {/* 신뢰도 표시 */}
                {extractionInfo.confidence !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    정확도: {Math.round(extractionInfo.confidence * 100)}%
                  </span>
                )}

                {/* 처리 시간 */}
                {extractionInfo.processingTime !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {extractionInfo.processingTime}ms
                  </span>
                )}
              </div>
            )}

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
                    <p className="text-xs font-medium text-card-foreground mb-1">이미지에서 추출된 텍스트:</p>
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
                <p className="text-sm font-medium text-card-foreground">이미지에서 텍스트 추출 중...</p>
                <p className="text-xs text-muted-foreground mt-1">잠시만 기다려주세요</p>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">검색 중...</span>
            )}
          </div>
        )}

        {!isLoading && searchResults.length === 0 && (searchQuery || uploadedImage) && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          </div>
        )}

        {!isLoading && searchResults.length === 0 && !searchQuery && !uploadedImage && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              질문을 입력하거나 이미지를 붙여넣으면 유사한 이전 답변을 찾아드립니다.
            </p>
          </div>
        )}

        {!isLoading && searchResults.map((answer) => {
          const isExpanded = expandedId === answer.id
          const isCopied = copiedId === answer.id

          return (
            <div
              key={answer.id}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/5"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {answer.category}
                    </Badge>
                    {answer.score && (
                      <Badge variant="secondary" className="text-xs">
                        유사도 {Math.round(answer.score * 100)}%
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(answer.timestamp)}
                    </span>
                    {answer.author && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {answer.author}
                      </span>
                    )}
                  </div>
                  <h4 className="font-medium text-card-foreground text-balance">{answer.question}</h4>
                  {answer.matchedKeywords && answer.matchedKeywords.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {answer.matchedKeywords.slice(0, 3).map((keyword, idx) => (
                        <span key={idx} className="text-xs text-primary">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {answer.imageUrl && <ImageIcon className="h-4 w-4 shrink-0 text-primary" />}
              </div>

              <p className="mb-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {isExpanded ? answer.answer : answer.answer.slice(0, 150) + (answer.answer.length > 150 ? '...' : '')}
              </p>

              {isExpanded && answer.imageUrl && (
                <div className="mb-3 overflow-hidden rounded-md border border-border">
                  <img
                    src={answer.imageUrl}
                    alt="답변 스크린샷"
                    className="h-auto w-full"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleExpand(answer.id)} className="gap-1.5 text-xs">
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
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(answer)} className="gap-1.5 text-xs">
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
          )
        })}
      </CardContent>
    </Card>
  )
}
