"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Search } from "lucide-react"
import { CategoryFilters } from "./category-filters"

export function QuestionInput({ onSearch }) {
  const [question, setQuestion] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const handleSubmit = async () => {
    if (!question.trim()) return

    console.log("[v0] Submitting question:", { question, category: selectedCategory })
    onSearch(question)
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-card-foreground">{"질문 분류"}</label>
        <CategoryFilters selected={selectedCategory} onSelect={setSelectedCategory} />
      </div>

      <div className="mb-4">
        <label htmlFor="question" className="mb-2 block text-sm font-medium text-card-foreground">
          {"학생 질문 입력"}
        </label>
        <Textarea
          id="question"
          placeholder="예: React에서 useState를 사용할 때 초기값을 어떻게 설정하나요?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="min-h-[120px] resize-none"
        />
      </div>

      <Button onClick={handleSubmit} disabled={!question.trim()} className="w-full gap-2" size="lg">
        <Search className="h-4 w-4" />
        {"검색하기"}
      </Button>
    </div>
  )
}
