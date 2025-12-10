"use client";

import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Loader2,
  ImageIcon,
  Save,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/constants";

export function AddQnAForm({ isOpen, onClose }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("Front-end");
  const [author, setAuthor] = useState("");
  const [keywords, setKeywords] = useState([]); // 배열로 변경
  const [extractionSource, setExtractionSource] = useState(null); // 추출 방식 표시용
  const [ocrText, setOcrText] = useState(""); // 이미지 OCR 텍스트
  const [questionImageUrl, setQuestionImageUrl] = useState(""); // 질문 이미지 URL
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const questionRef = useRef(null);
  const answerRef = useRef(null);

  if (!isOpen) return null;

  // 이미지를 서버에 업로드하고 URL 반환
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Image upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  // 이미지에서 텍스트 추출 (OCR)
  const extractTextFromImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      console.log("🖼️ [Add QnA] Extracting text from image...");
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("OCR API failed");
      }

      const data = await response.json();

      // Hallucination 감지 확인
      if (data.note && data.note.includes("hallucination")) {
        console.warn(
          "⚠️ [Add QnA] Hallucination detected - no text extracted from image"
        );
        return "";
      }

      if (data.text) {
        console.log(
          `✅ [Add QnA] OCR extracted text: ${data.text.substring(0, 50)}...`
        );
        return data.text;
      }

      console.warn("⚠️ [Add QnA] No text found in image");
      return "";
    } catch (err) {
      console.error("❌ [Add QnA] OCR Error:", err);
      // OCR 실패가 전체 프로세스를 막지 않도록 빈 문자열 반환
      return "";
    }
  };

  // 텍스트 영역에 이미지 마크다운 삽입
  const insertImageMarkdown = (textarea, imageUrl) => {
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);

    const imageMarkdown = `![이미지](${imageUrl})`;
    const newValue = textBefore + imageMarkdown + textAfter;

    return {
      newValue,
      newCursorPos: cursorPos + imageMarkdown.length,
    };
  };

  // 붙여넣기 이벤트 핸들러
  const handlePaste = (e, field) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          handleImageUpload(file, field);
        }
        break;
      }
    }
  };

  // Tab 키 핸들러 (들여쓰기 지원)
  const handleKeyDown = (e, field) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Tab 문자 삽입
      const newValue = value.substring(0, start) + "\t" + value.substring(end);

      if (field === "question") {
        setQuestion(newValue);
      } else {
        setAnswer(newValue);
      }

      // 커서 위치 조정
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  // 이미지 업로드 및 OCR 처리
  const handleImageUpload = async (file, field) => {
    setIsUploading(true);
    setError(null);

    try {
      console.log(
        `📤 [Add QnA] Uploading image: ${file.name} (${file.size} bytes)`
      );

      // 동시 처리: 이미지 업로드 및 OCR
      const [imageUrl, extractedText] = await Promise.all([
        uploadImage(file),
        extractTextFromImage(file),
      ]);

      console.log(`✅ [Add QnA] Image uploaded: ${imageUrl}`);

      // 질문 필드에 이미지 붙여넣기
      if (field === "question") {
        // OCR 텍스트를 ocrText에 저장
        if (extractedText) {
          setOcrText((prev) => `${prev}\n\n${extractedText}`.trim());
          console.log(`✅ [Add QnA] OCR text extracted`);
        }
        
        // 이미지 마크다운을 질문 본문에 삽입 (OCR 텍스트는 추가하지 않음)
        const textarea = questionRef.current;
        if (textarea) {
          const { newValue, newCursorPos } = insertImageMarkdown(
            textarea,
            imageUrl
          );
          setQuestion(newValue);

          // 커서 위치 복원
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        } else {
          // textarea가 없으면 직접 설정
          const imageMarkdown = `![이미지](${imageUrl})`;
          setQuestion(imageMarkdown);
        }
        
        // 이미지 URL 저장 (검색 결과에서 표시용)
        setQuestionImageUrl(imageUrl);
        console.log(`✅ [Add QnA] Question image URL saved: ${imageUrl}`);
      }
      // 답변 필드에 이미지 붙여넣기 (기존 로직 유지)
      else {
        if (extractedText) {
          setOcrText((prev) => `${prev}\n\n${extractedText}`.trim());
        }

        const textarea = answerRef.current;
        if (textarea) {
          const { newValue, newCursorPos } = insertImageMarkdown(
            textarea,
            imageUrl
          );
          setAnswer(newValue);

          // 커서 위치 복원
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
          }, 0);
        }
      }
    } catch (err) {
      console.error("❌ [Add QnA] Image processing error:", err);
      setError(`이미지 처리 실패: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // 입력값 검증
      if (!question.trim() || !answer.trim()) {
        throw new Error("질문과 답변을 모두 입력해주세요.");
      }

      console.log("🔍 [Add QnA] Auto-extracting keywords (hybrid mode)...");

      // 질문과 답변, OCR 텍스트를 합쳐서 하이브리드 키워드 추출
      const combinedText = `${question} ${answer} ${ocrText}`.trim();
      const extractResponse = await fetch("/api/extract-keywords-hybrid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: combinedText,
          isOCR: ocrText.length > 0,
        }),
      });

      if (!extractResponse.ok) {
        throw new Error("키워드 추출 실패");
      }

      const extractData = await extractResponse.json();
      const finalKeywords = extractData.keywords || [];

      console.log(
        `✅ [Add QnA] Keywords extracted: [${finalKeywords.join(", ")}]`
      );
      console.log(
        `📊 [Add QnA] Source: ${extractData.source}, Confidence: ${Math.round(
          extractData.confidence * 100
        )}%`
      );

      // 추출 정보 저장 (UI 표시용)
      setKeywords(finalKeywords);
      setExtractionSource(extractData.source);

      // 키워드가 추출되지 않은 경우
      if (finalKeywords.length === 0) {
        throw new Error(
          "키워드를 추출할 수 없습니다. 질문과 답변에 더 많은 정보를 포함해주세요."
        );
      }

      // 추출된 카테고리로 자동 설정 (선택사항)
      let finalCategory = category;
      if (
        extractData.category &&
        CATEGORIES.find((c) => c.value === extractData.category)
      ) {
        finalCategory = extractData.category;
        setCategory(extractData.category);
        console.log(
          `📁 [Add QnA] Category auto-set to: ${extractData.category}`
        );
      }

      console.log("💾 [Add QnA] Saving new Q&A...");

      const response = await fetch("/api/qna/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          category: finalCategory,
          author: author.trim() || "익명",
          keywords: finalKeywords,
          ocrText: ocrText.trim(), // OCR 텍스트 추가
          imageUrl: questionImageUrl || null, // 질문 이미지 URL 추가
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "저장 실패");
      }

      const data = await response.json();
      console.log("✅ [Add QnA] Successfully saved:", data.qna.id);

      setSuccess(true);

      // 성공 후 폼 리셋 및 닫기
      setTimeout(() => {
        setQuestion("");
        setAnswer("");
        setCategory("Front-end");
        setAuthor("");
        setKeywords([]);
        setExtractionSource(null);
        setOcrText(""); // OCR 텍스트 리셋
        setQuestionImageUrl(""); // 질문 이미지 URL 리셋
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("❌ [Add QnA] Save error:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 pt-16">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>새 질의응답 등록</CardTitle>
                  <CardDescription className="mt-2">
                    질문과 답변을 입력하고 저장하면 키워드가 자동으로 추출됩니다
                    (로컬 우선). 이미지는 붙여넣기(Ctrl+V)로 업로드됩니다.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 카테고리 */}
                <div className="space-y-2">
                  <Label htmlFor="category">카테고리</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 작성자 */}
                <div className="space-y-2">
                  <Label htmlFor="author">작성자</Label>
                  <Input
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="작성자 이름을 입력하세요 (선택사항, 기본값: 익명)"
                    disabled={isUploading || isSaving}
                  />
                </div>

                {/* 질문 */}
                <div className="space-y-2">
                  <Label htmlFor="question">
                    질문
                    {isUploading && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (이미지 업로드 중...)
                      </span>
                    )}
                  </Label>
                  <Textarea
                    ref={questionRef}
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onPaste={(e) => handlePaste(e, "question")}
                    onKeyDown={(e) => handleKeyDown(e, "question")}
                    placeholder="질문을 입력하세요. 이미지를 붙여넣으면 자동으로 업로드됩니다."
                    rows={4}
                    disabled={isUploading || isSaving}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Ctrl+V 또는 Cmd+V로 이미지 붙여넣기 가능
                  </p>
                </div>

                {/* 답변 */}
                <div className="space-y-2">
                  <Label htmlFor="answer">
                    답변
                    {isUploading && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (이미지 업로드 중...)
                      </span>
                    )}
                  </Label>
                  <Textarea
                    ref={answerRef}
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onPaste={(e) => handlePaste(e, "answer")}
                    onKeyDown={(e) => handleKeyDown(e, "answer")}
                    placeholder="답변을 입력하세요. 이미지를 붙여넣으면 자동으로 업로드됩니다."
                    rows={15}
                    disabled={isUploading || isSaving}
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Ctrl+V 또는 Cmd+V로 이미지 붙여넣기 가능
                  </p>
                </div>

                {/* 키워드 미리보기 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>키워드 (자동 추출)</Label>
                    {extractionSource && (
                      <Badge variant="outline" className="text-xs">
                        {extractionSource === "local"
                          ? "로컬 추출"
                          : extractionSource === "llm"
                          ? "AI 추출"
                          : extractionSource === "local_fallback"
                          ? "로컬 (백업)"
                          : "하이브리드"}
                      </Badge>
                    )}
                  </div>

                  {/* 추출된 키워드 표시 */}
                  {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 rounded-md bg-muted/50 min-h-[42px]">
                      {keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-md bg-muted/50 text-sm text-muted-foreground min-h-[42px] flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      저장 시 자동으로 키워드가 추출됩니다 (로컬 우선)
                    </div>
                  )}
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* 성공 메시지 */}
                {success && (
                  <Alert className="border-green-500 bg-green-50 text-green-900">
                    <AlertDescription>
                      ✅ 질의응답이 성공적으로 등록되었습니다!
                    </AlertDescription>
                  </Alert>
                )}

                {/* 버튼 */}
                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isUploading || isSaving}
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || isSaving}
                    className="gap-2"
                  >
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
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
