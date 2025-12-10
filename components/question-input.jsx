"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search, Image as ImageIcon, X } from "lucide-react";

export function QuestionInput({ onSearch }) {
  const [question, setQuestion] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const textareaRef = useRef(null);

  // 붙여넣기 이벤트 핸들러
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 클립보드에서 이미지 찾기
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault(); // 기본 붙여넣기 동작 방지

        const file = items[i].getAsFile();
        if (!file) continue;

        console.log("📋 [Paste] Image detected:", file.type);

        // 이미지 파일 저장
        setUploadedImage(file);

        // 썸네일 생성
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        break;
      }
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    // 텍스트나 이미지 중 하나는 있어야 함
    if (!question.trim() && !uploadedImage) return;

    // 텍스트와 이미지를 함께 전달
    onSearch(question, "all", uploadedImage);
  };

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6">
      <div className="mb-4">
        <label
          htmlFor="question"
          className="mb-2 block text-sm font-medium text-card-foreground"
        >
          {"학생 질문 입력 (선택 사항)"}
        </label>
        <Textarea
          ref={textareaRef}
          id="question"
          placeholder="예: React에서 useState를 사용할 때 초기값을 어떻게 설정하나요? (또는 Ctrl+V로 에러 화면 이미지를 붙여넣으세요)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onPaste={handlePaste}
          className="min-h-[120px] resize-none"
        />
        <p className="mt-3 text-xs text-muted-foreground">
          💡 팁: 에러 화면을 캡처한 후 Ctrl+V (Mac: Cmd+V)로 붙여넣으면 검색 시
          이미지에서 텍스트가 자동 추출됩니다.
        </p>
      </div>

      {/* 이미지 첨부 표시 */}
      {uploadedImage && imagePreview && (
        <div className="mb-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              {/* 썸네일 */}
              <div className="shrink-0">
                <img
                  src={imagePreview}
                  alt="첨부된 이미지"
                  className="h-20 w-20 rounded object-cover border border-border"
                />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm text-card-foreground">
                    이미지 1장 첨부됨
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  검색하기 버튼을 누르면 이미지에서 텍스트가 자동으로
                  추출됩니다.
                </p>
              </div>

              {/* 제거 버튼 */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!question.trim() && !uploadedImage}
        className="w-full gap-2"
        size="lg"
      >
        <Search className="h-4 w-4" />
        {"검색하기"}
      </Button>
    </div>
  );
}
