"use client";

import { useState } from "react";
import { QuestionInput } from "@/components/question-input";
import { ResultsSection } from "@/components/results-section";
import { Header } from "@/components/header";
import { AddQnAForm } from "@/components/add-qna-form";

export default function Home() {
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showAddQnAForm, setShowAddQnAForm] = useState(false);

  const handleSearch = (query, category, image) => {
    setSearchQuery(query);
    setSelectedCategory(category);
    setUploadedImage(image);
    setShowResults(true);
  };

  return (
    <>
      <Header onAddQnAClick={() => setShowAddQnAForm(true)} />

      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      <AddQnAForm
        isOpen={showAddQnAForm}
        onClose={() => setShowAddQnAForm(false)}
      />
    </>
  );
}
