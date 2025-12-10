# WenivBuddy

부트캠프 환경을 위한 AI 기반 Q&A 어시스턴트입니다. 학생들의 질문에 대해 과거 답변을 검색하고, AI가 상황에 맞는 답변을 생성합니다.

## 주요 기능

### 1. 스마트 질문 입력

- 텍스트로 질문 입력
- 이미지 붙여넣기 지원 (Ctrl+V / Cmd+V)
- 에러 스크린샷에서 자동으로 텍스트 추출 (OCR)

### 2. 하이브리드 검색 시스템

- 키워드 기반 검색으로 과거 Q&A 데이터베이스에서 관련 답변 찾기
- 텍스트와 이미지(OCR)를 함께 활용한 정확한 검색
- 카테고리별 필터링 지원

### 3. AI 답변 생성

- GPT-4o-mini 기반의 멘토 톤 답변
- 과거 답변을 참고하여 일관성 있는 답변 제공
- 답변 복사 및 저장 기능

### 4. Q&A 데이터 관리

- 새로운 Q&A 추가 기능
- 저장된 답변은 향후 검색에 활용
- JSON 기반 데이터베이스 관리

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, Radix UI
- **AI**: OpenAI API (GPT-4o-mini)
- **OCR**: 이미지 텍스트 추출
- **분석**: Vercel Analytics

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/WenivBuddy.git
cd WenivBuddy
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```

**OpenAI API Key 발급 방법:**

1. https://platform.openai.com 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴에서 새 키 생성

**비용 정보:**

- GPT-4o-mini 모델 사용
- 입력: $0.150 / 1M 토큰
- 출력: $0.600 / 1M 토큰
- 질문당 약 $0.0005-0.001

> AI 답변 생성은 사용자가 명시적으로 버튼을 눌렀을 때만 실행됩니다.
> 검색 기능은 로컬 데이터베이스를 사용하므로 무료입니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 확인하세요.

### 5. 프로덕션 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
WenivBuddy/
├── app/
│   ├── api/              # API 라우트
│   │   ├── generate-answer/  # AI 답변 생성
│   │   ├── extract-keywords/  # 키워드 추출
│   │   ├── ocr/              # 이미지 텍스트 추출
│   │   ├── qna/              # Q&A CRUD
│   │   └── upload-image/     # 이미지 업로드
│   ├── layout.jsx        # 루트 레이아웃
│   └── page.jsx          # 메인 페이지
├── components/           # React 컴포넌트
│   ├── question-input.jsx    # 질문 입력
│   ├── results-section.jsx   # 검색 결과
│   ├── previous-answers.jsx  # 과거 답변 표시
│   ├── ai-answer.jsx         # AI 답변 생성
│   ├── add-qna-form.jsx      # Q&A 추가 폼
│   └── ui/                   # Radix UI 컴포넌트
├── lib/                  # 유틸리티 함수
│   ├── hybrid-keyword-extractor.js  # 하이브리드 키워드 추출
│   ├── keyword-extractor.js         # 키워드 추출
│   ├── qna-search.js               # Q&A 검색 로직
│   └── ocr-text-filter.js          # OCR 텍스트 필터링
└── public/
    └── data/
        └── qna-database.json  # Q&A 데이터베이스
```

## 사용 방법

### 질문하기

1. 질문을 텍스트로 입력하거나
2. 에러 스크린샷을 Ctrl+V로 붙여넣기
3. "검색하기" 버튼 클릭

### 검색 결과 확인

- 과거 답변: 데이터베이스에서 관련된 Q&A 자동 표시
- AI 답변: "AI 답변 생성" 버튼을 눌러 새로운 답변 생성

### 답변 저장하기

1. AI 답변 생성 후 "저장" 버튼 클릭
2. 제목, 카테고리, 태그 입력
3. 저장하면 향후 검색에 활용됨

### Q&A 추가하기

1. 헤더의 "Q&A 추가" 버튼 클릭
2. 질문, 답변, 카테고리, 태그 입력
3. 저장

## 배포

### Vercel 배포 (추천)

1. https://vercel.com 접속
2. GitHub 저장소 연결
3. 환경 변수 설정 (OPENAI_API_KEY)
4. 자동 배포

GitHub에 푸시할 때마다 자동으로 재배포됩니다.

### CLI로 배포

```bash
npm install -g vercel
vercel login
vercel
```

## 개발 가이드

### 새로운 API 라우트 추가

```javascript
// app/api/your-route/route.js
export async function POST(request) {
  const data = await request.json();
  // 로직 처리
  return Response.json({ result: data });
}
```

### 새로운 컴포넌트 추가

```javascript
// components/your-component.jsx
"use client";

export function YourComponent() {
  return <div>Your component</div>;
}
```
