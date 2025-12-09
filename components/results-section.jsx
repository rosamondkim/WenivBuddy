"use client"

import { useState } from "react"
import { PreviousAnswers } from "./previous-answers"
import { AiAnswer } from "./ai-answer"

export function ResultsSection({ searchQuery, selectedCategory = "all", uploadedImage = null }) {
  const [extractionInfo, setExtractionInfo] = useState(null)
  const [ocrText, setOcrText] = useState(null)

  return (
    <div className="space-y-6">
      <PreviousAnswers
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        uploadedImage={uploadedImage}
        onExtractionInfoChange={setExtractionInfo}
        onOCRTextExtracted={setOcrText}
      />

      <AiAnswer
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        extractionInfo={extractionInfo}
        ocrText={ocrText}
      />
    </div>
  )
}
