"use client"

import { useState } from "react"
import { PreviousAnswers } from "./previous-answers"
import { SimilarQuestions } from "./similar-questions"
import { ReferenceCards } from "./reference-cards"
import { AiAnswer } from "./ai-answer"

export function ResultsSection({ searchQuery, selectedCategory = "all", uploadedImage = null }) {
  const [extractionInfo, setExtractionInfo] = useState(null)
  const [ocrText, setOcrText] = useState(null)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PreviousAnswers
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          uploadedImage={uploadedImage}
          onExtractionInfoChange={setExtractionInfo}
          onOCRTextExtracted={setOcrText}
        />
        <div className="space-y-6">
          <SimilarQuestions />
          <ReferenceCards />
        </div>
      </div>

      <AiAnswer
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        extractionInfo={extractionInfo}
        ocrText={ocrText}
      />
    </div>
  )
}
