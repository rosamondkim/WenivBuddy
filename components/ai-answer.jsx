"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Copy, CheckCheck, Loader2 } from "lucide-react"

export function AiAnswer({ searchQuery }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [isCopied, setIsCopied] = useState(false)

  const generateAnswer = async () => {
    setIsGenerating(true)
    // TODO: Implement actual AI generation
    setTimeout(() => {
      setAnswer(
        `${searchQuery}에 대한 AI 생성 답변입니다.\n\n이 답변은 여러 신뢰할 수 있는 소스와 공식 문서를 기반으로 생성되었습니다. 위의 이전 답변들에서 원하는 내용을 찾지 못한 경우 참고하실 수 있습니다.\n\n주요 포인트:\n1. 기본 개념과 사용법을 이해하는 것이 중요합니다\n2. 실제 프로젝트에 적용하면서 학습하는 것을 권장합니다\n3. 공식 문서와 최신 베스트 프랙티스를 참고하세요\n\n추가로 궁금한 점이 있다면 언제든지 질문해주세요!`,
      )
      setIsGenerating(false)
    }, 2000)
  }

  const copyToClipboard = async () => {
    if (!answer) return
    await navigator.clipboard.writeText(answer)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-balance">
          <Sparkles className="h-5 w-5 text-primary" />
          {"AI 생성 답변"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!answer && !isGenerating && (
          <div className="text-center py-8">
            <p className="mb-4 text-sm text-muted-foreground text-balance">
              {"위의 답변들 중 마음에 드는 답변이 없나요?"}
              <br />
              {"AI가 새로운 답변을 생성해드립니다."}
            </p>
            <Button onClick={generateAnswer} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {"AI 답변 생성하기"}
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{"AI 답변을 생성하고 있습니다..."}</p>
            </div>
          </div>
        )}

        {answer && !isGenerating && (
          <div>
            <div className="mb-4 rounded-lg bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{answer}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5 bg-transparent">
                {isCopied ? (
                  <>
                    <CheckCheck className="h-3.5 w-3.5" />
                    {"복사됨"}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {"답변 복사"}
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={generateAnswer} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {"다시 생성"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
