"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, Copy, CheckCheck, Loader2 } from "lucide-react"

export function AiAnswer({ searchQuery, selectedCategory = "all" }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [answer, setAnswer] = useState(null)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState(null)

  const generateAnswer = async () => {
    if (!searchQuery) return

    setIsGenerating(true)
    setError(null)

    try {
      console.log('🤖 [AI Answer] Calling API...')

      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: searchQuery,
          category: selectedCategory
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data = await response.json()

      console.log('✅ [AI Answer] Answer generated successfully')
      setAnswer(data.answer)

    } catch (err) {
      console.error('❌ [AI Answer] Failed to generate:', err)
      setError(err.message)

      // API 키가 없는 경우
      if (err.message.includes('API key')) {
        setAnswer(
          `⚠️ AI 답변 생성을 위해서는 OpenAI API 키가 필요합니다.\n\n.env.local 파일에 OPENAI_API_KEY를 설정해주세요.\n\n현재는 데이터베이스의 기존 답변만 검색할 수 있습니다.`
        )
      }
      // 크레딧 부족 또는 결제 정보 필요
      else if (err.message.includes('insufficient_quota') || err.message.includes('billing') || err.message.includes('quota')) {
        setAnswer(
          `💳 OpenAI API 크레딧이 부족합니다.\n\n해결 방법:\n\n1. OpenAI Platform 접속\n   👉 https://platform.openai.com/\n\n2. Settings → Billing 메뉴로 이동\n\n3. 크레딧 구매 또는 결제 정보 추가\n   - 최소 $5부터 구매 가능\n   - 신규 가입 시 $5 무료 크레딧 제공 (3개월 유효)\n\n4. 크레딧 충전 후 다시 시도\n\n💡 참고: 위의 "이전 답변" 섹션은 무료로 계속 사용 가능합니다.`
        )
      }
      // 기타 에러
      else {
        setAnswer(
          `죄송합니다. AI 답변 생성 중 오류가 발생했습니다.\n\n에러: ${err.message}\n\n잠시 후 다시 시도해주세요.`
        )
      }
    } finally {
      setIsGenerating(false)
    }
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
