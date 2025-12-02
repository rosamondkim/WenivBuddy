"use client"

import { PreviousAnswers } from "./previous-answers"
import { SimilarQuestions } from "./similar-questions"
import { ReferenceCards } from "./reference-cards"
import { FaqRecommendation } from "./faq-recommendation"
import { AiAnswer } from "./ai-answer"

export function ResultsSection({ searchQuery }) {
  // TODO: Replace with actual data from API/state management
  const shouldShowFaqPrompt = true

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PreviousAnswers searchQuery={searchQuery} />
        <div className="space-y-6">
          <SimilarQuestions />
          <ReferenceCards />
        </div>
      </div>

      {shouldShowFaqPrompt && <FaqRecommendation />}

      <AiAnswer searchQuery={searchQuery} />
    </div>
  )
}
