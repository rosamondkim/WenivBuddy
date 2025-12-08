"use client";

import { useState } from "react";
import { QuestionInput } from "@/components/question-input";
import { ResultsSection } from "@/components/results-section";
import { Logo } from "@/components/logo";

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleSearch = (query, category, image) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    setUploadedImage(image);
    setShowResults(true);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Logo />
        <QuestionInput onSearch={handleSearch} />
        {showResults && (
          <ResultsSection
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            uploadedImage={uploadedImage}
          />
        )}
      </div>
    </main>
  );
}
