"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from "lucide-react"
import { CATEGORIES } from "@/lib/constants"

export function SaveAnswerDialog({ open, onOpenChange, question, ocrText = null, answer, initialKeywords = [], initialCategory = "all" }) {
  const [isSaving, setIsSaving] = useState(false)
  const [editedQuestion, setEditedQuestion] = useState(question)
  const [editedAnswer, setEditedAnswer] = useState(answer)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory === "all" ? "Front-end" : initialCategory)
  const [author, setAuthor] = useState("")
  const [keywordsInput, setKeywordsInput] = useState(initialKeywords.join(", "))
  const [error, setError] = useState(null)

  // Tab 키 핸들러 (들여쓰기 지원)
  const handleKeyDown = (e, field) => {
    if (e.key === 'Tab') {
      e.preventDefault()

      const textarea = e.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      // Tab 문자 삽입
      const newValue = value.substring(0, start) + '\t' + value.substring(end)

      if (field === 'question') {
        setEditedQuestion(newValue)
      } else if (field === 'answer') {
        setEditedAnswer(newValue)
      }

      // 커서 위치 조정
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // 키워드 문자열을 배열로 변환
      const keywords = keywordsInput
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0)

      if (keywords.length === 0) {
        setError("최소 1개 이상의 키워드를 입력해주세요.")
        setIsSaving(false)
        return
      }

      if (!editedQuestion.trim() || !editedAnswer.trim()) {
        setError("질문과 답변을 모두 입력해주세요.")
        setIsSaving(false)
        return
      }

      console.log('💾 [Save Answer] Saving to database...')

      const response = await fetch('/api/qna/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: editedQuestion,
          answer: editedAnswer,
          category: selectedCategory,
          author: author.trim() || '익명',
          keywords,
          ocrText: ocrText || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `저장 실패: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ [Save Answer] Successfully saved:', data.qna.id)

      // 성공 후 다이얼로그 닫기
      onOpenChange(false)

      // 성공 메시지 표시 (선택적)
      alert(`답변이 성공적으로 데이터베이스에 추가되었습니다!\nID: ${data.qna.id}`)

    } catch (err) {
      console.error('❌ [Save Answer] Failed:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>답변을 데이터베이스에 저장</DialogTitle>
          <DialogDescription>
            AI가 생성한 답변을 검토하고 수정한 후 데이터베이스에 추가하세요.
            이후 같은 질문에 대해 즉시 답변할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 카테고리 선택 */}
          <div className="grid gap-2">
            <Label htmlFor="category">카테고리</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 작성자 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="author">작성자</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="작성자 이름을 입력하세요 (선택사항, 기본값: 익명)"
            />
          </div>

          {/* 질문 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="question">질문</Label>
            <Textarea
              id="question"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'question')}
              rows={3}
              placeholder="질문을 입력하세요"
            />
          </div>

          {/* 답변 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="answer">답변</Label>
            <Textarea
              id="answer"
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'answer')}
              rows={15}
              placeholder="답변을 입력하세요"
            />
          </div>

          {/* 키워드 입력 */}
          <div className="grid gap-2">
            <Label htmlFor="keywords">
              키워드 <span className="text-xs text-muted-foreground">(쉼표로 구분)</span>
            </Label>
            <Input
              id="keywords"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="예: React, useState, hooks"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                저장하기
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
