장기적으로 서비스로 가져갈 거면,
JSON은 MVP용, 실제 운영은 Supabase(Postgres)로

# WenivBuddy 프로젝트 개요

## 📋 프로젝트 소개

**WenivBuddy**는 위니브 부트캠프 환경에서 학생들의 질문에 AI가 답변해주는 Q&A 어시스턴트입니다. 기존 답변 데이터베이스를 검색하거나, 없을 경우 AI가 새로운 답변을 생성합니다.

### 주요 특징

- 🤖 **AI 기반 답변 생성**: OpenAI GPT-4o-mini를 활용한 자연스러운 답변
- 🔍 **스마트 검색**: 하이브리드 키워드 추출 및 유사도 기반 검색
- 🖼️ **이미지 OCR**: 에러 화면 스크린샷에서 텍스트 자동 추출
- 💾 **답변 저장**: 생성된 답변을 데이터베이스에 저장하여 재사용
- 📱 **반응형 UI**: 모던하고 직관적인 사용자 인터페이스

---

## 🛠️ 기술 스택

### 프론트엔드

- **Next.js 16.0.3** - React 프레임워크
- **React 19.2.0** - UI 라이브러리
- **Tailwind CSS 4.1.9** - 스타일링
- **Radix UI** - 접근성 있는 UI 컴포넌트
- **Lucide React** - 아이콘 라이브러리

### 백엔드

- **Next.js API Routes** - 서버 사이드 API
- **OpenAI API** - GPT-4o-mini 모델 사용
  - 채팅 완성 (답변 생성)
  - Vision API (OCR)
- **JSON 파일 기반 데이터베이스** - MVP용 (운영 환경에서는 Supabase/PostgreSQL 예정)

### 주요 라이브러리

- **class-variance-authority** - 컴포넌트 변형 관리
- **zod** - 스키마 검증
- **react-hook-form** - 폼 관리
- **date-fns** - 날짜 처리
- **sonner** - 토스트 알림

---

## 📁 프로젝트 구조

```
WenivBuddy/
├── app/                          # Next.js 앱 라우터
│   ├── api/                      # API 엔드포인트
│   │   ├── extract-keywords/    # 키워드 추출 API
│   │   ├── generate-answer/     # AI 답변 생성 API
│   │   ├── ocr/                  # 이미지 OCR API
│   │   └── qna/                  # Q&A 관련 API
│   │       ├── add/              # 답변 추가 API
│   │       └── search/          # Q&A 검색 API
│   ├── layout.jsx                # 루트 레이아웃
│   └── page.jsx                  # 메인 페이지
├── components/                   # React 컴포넌트
│   ├── ui/                       # 재사용 가능한 UI 컴포넌트
│   ├── ai-answer.jsx             # AI 답변 표시 컴포넌트
│   ├── previous-answers.jsx     # 이전 답변 목록 컴포넌트
│   ├── question-input.jsx        # 질문 입력 컴포넌트
│   ├── results-section.jsx       # 검색 결과 섹션
│   ├── save-answer-dialog.jsx    # 답변 저장 다이얼로그
│   └── logo.jsx                  # 로고 컴포넌트
├── lib/                          # 유틸리티 및 라이브러리
│   ├── hybrid-keyword-extractor.js  # 하이브리드 키워드 추출
│   ├── keyword-extractor.js         # 로컬 키워드 추출
│   ├── keyword-mapping.js           # 한영 키워드 매핑
│   ├── llm-keyword-extractor.js     # LLM 키워드 추출
│   ├── qna-search.js                # Q&A 검색 로직
│   └── utils.js                     # 공통 유틸리티
├── public/                       # 정적 파일
│   └── data/                     # 데이터 파일
│       └── qna-database.json     # Q&A 데이터베이스
└── scripts/                     # 유틸리티 스크립트
    └── migrate-qna.js           # 데이터 마이그레이션 스크립트
```

---

## 🎯 주요 기능

### 1. 질문 입력 및 이미지 업로드

**파일**: `components/question-input.jsx`

- 텍스트 질문 입력
- 이미지 붙여넣기 지원 (Ctrl+V / Cmd+V)
- 이미지 미리보기 및 제거 기능
- 텍스트 또는 이미지 중 하나만 있어도 검색 가능

**특징**:

- 클립보드에서 이미지 직접 붙여넣기
- 이미지 썸네일 표시
- 사용자 친화적인 안내 메시지

### 2. 이미지 OCR (텍스트 추출)

**API**: `app/api/ocr/route.js`

- OpenAI Vision API를 사용한 이미지 내 텍스트 추출
- 에러 메시지, 코드, 파일 경로 등 정확하게 추출
- 자동으로 질문에 포함되어 검색에 활용

**처리 과정**:

1. 이미지를 base64로 인코딩
2. GPT-4o-mini Vision API 호출
3. 추출된 텍스트를 질문에 자동 추가

### 3. 하이브리드 키워드 추출

**파일**: `lib/hybrid-keyword-extractor.js`

**2단계 추출 방식**:

#### 1단계: 로컬 추출 (무료)

- 기술 용어 사전 기반 추출
- 한영 키워드 매핑 적용
- N-gram 생성으로 구문 매칭
- 신뢰도 계산 (기술 용어 포함 여부, 키워드 개수 등)

#### 2단계: LLM 추출 (유료, 신뢰도 낮을 때만)

- 신뢰도가 0.7 미만일 때만 OpenAI API 호출
- 한글 용어를 영문 표준 용어로 변환
- 오타 수정 및 카테고리 자동 분류
- 비용 최적화를 위한 스마트 폴백

**카테고리**:

- Frontend
- Backend
- CSS
- JavaScript
- Git
- 도구

### 4. Q&A 검색

**API**: `app/api/qna/search/route.js`  
**라이브러리**: `lib/qna-search.js`

**검색 알고리즘**:

1. 하이브리드 키워드 추출
2. 카테고리 필터링 (선택적)
3. 유사도 점수 계산:
   - 키워드 유사도 (Jaccard): 40%
   - 제목 매칭: 25%
   - 본문 매칭: 15%
   - OCR 텍스트 매칭: 10%
   - 답변 매칭: 10%
4. 최소 유사도 임계값 이상만 필터링 (기본 50%)
5. 상위 N개 결과 반환 (기본 3개)

**결과 표시**:

- 유사도 점수 표시
- 카테고리 및 태그 표시
- 접기/펼치기 기능
- 답변 복사 기능
- OCR 텍스트 토글 표시

### 5. AI 답변 생성

**API**: `app/api/generate-answer/route.js`  
**컴포넌트**: `components/ai-answer.jsx`

**특징**:

- GPT-4o-mini 모델 사용
- 부트캠프 멘토 톤으로 답변 생성
- 자연스러운 대화체 스타일
- 상황 공감 및 단계별 해결 가이드 제공

**답변 스타일**:

- 편안하지만 정중한 대화체
- 실제 멘토처럼 상황 확인 및 공감
- 바로 해결에 필요한 정보 우선
- 단계별 체크리스트 중심
- 불필요한 긴 설명 최소화

**에러 처리**:

- API 키 없음 안내
- 크레딧 부족 안내 및 해결 방법 제시
- 기타 에러 메시지 표시

### 6. 답변 저장

**API**: `app/api/qna/add/route.js`  
**컴포넌트**: `components/save-answer-dialog.jsx`

**기능**:

- AI 생성 답변을 데이터베이스에 저장
- 질문, 답변, 카테고리, 키워드 수정 가능
- 제목 및 태그 자동 생성
- OCR 텍스트 저장 지원

**자동 생성 항목**:

- **제목**: 질문 본문 또는 OCR 에러 라인 기반
- **태그**: OCR 텍스트 및 키워드 분석 기반
  - Windows, PowerShell, npm, Node.js, React, Git, CSS, VSCode 등

**데이터 스키마**:

```json
{
  "id": "qna-001",
  "category": "Frontend",
  "title": "질문 제목",
  "body": "질문 본문",
  "ocrText": "이미지에서 추출된 텍스트",
  "ocrErrorLine": "에러 메시지 첫 줄",
  "tags": ["React", "useState"],
  "keywords": ["React", "useState", "hooks"],
  "answer": "답변 내용",
  "author": "AI 생성 (사용자 추가)",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "views": 0
}
```

### 7. 이전 답변 표시

**컴포넌트**: `components/previous-answers.jsx`

**기능**:

- 검색 결과 목록 표시
- 각 답변의 상세 정보 표시:
  - 카테고리, 태그, 유사도 점수
  - 질문 본문 및 OCR 텍스트
  - 답변 내용
  - 작성 시간 및 작성자
- 접기/펼치기 기능
- 답변 복사 기능
- OCR 텍스트 토글 표시
- 키워드 추출 정보 표시 (AI 분석 / 로컬 분석, 신뢰도, 처리 시간)

---

## 🔌 API 엔드포인트

### 1. POST `/api/qna/search`

Q&A 데이터베이스에서 유사한 답변 검색

**요청 본문**:

```json
{
  "query": "검색어",
  "category": "all" | "Frontend" | "Backend" | ...,
  "maxResults": 3,
  "minSimilarity": 0.5
}
```

**응답**:

```json
{
  "results": [
    {
      "id": "qna-001",
      "category": "Frontend",
      "title": "...",
      "body": "...",
      "answer": "...",
      "score": 0.85,
      ...
    }
  ],
  "extractionInfo": {
    "keywords": ["React", "useState"],
    "source": "llm" | "local",
    "confidence": 0.9,
    "cost": 0.0001,
    "processingTime": 150,
    "category": "Frontend"
  }
}
```

### 2. POST `/api/generate-answer`

AI를 사용한 새로운 답변 생성

**요청 본문**:

```json
{
  "question": "질문 내용",
  "category": "Frontend"
}
```

**응답**:

```json
{
  "answer": "생성된 답변 내용",
  "model": "gpt-4o-mini",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 200,
    "total_tokens": 300
  },
  "category": "Frontend"
}
```

### 3. POST `/api/ocr`

이미지에서 텍스트 추출

**요청**: FormData

- `image`: 이미지 파일

**응답**:

```json
{
  "text": "추출된 텍스트",
  "model": "gpt-4o-mini",
  "usage": {...},
  "imageSize": 12345,
  "imageType": "image/png"
}
```

### 4. POST `/api/qna/add`

새로운 Q&A를 데이터베이스에 추가

**요청 본문**:

```json
{
  "question": "질문",
  "answer": "답변",
  "category": "Frontend",
  "keywords": ["React", "useState"],
  "ocrText": "이미지 텍스트 (선택)"
}
```

**응답**:

```json
{
  "success": true,
  "qna": {
    "id": "qna-001",
    ...
  },
  "message": "Q&A successfully added to database"
}
```

### 5. POST `/api/extract-keywords`

LLM을 사용한 키워드 추출 (하이브리드 시스템에서 내부 사용)

**요청 본문**:

```json
{
  "question": "질문 내용"
}
```

**응답**:

```json
{
  "keywords": ["React", "useState"],
  "category": "Frontend",
  "corrected_terms": {"리액트": "React"},
  "source": "llm",
  "model": "gpt-4o-mini",
  "usage": {...}
}
```

---

## 🎨 UI 컴포넌트

### 주요 컴포넌트

1. **QuestionInput** (`components/question-input.jsx`)

   - 질문 입력 텍스트 영역
   - 이미지 붙여넣기 지원
   - 이미지 미리보기 및 제거

2. **ResultsSection** (`components/results-section.jsx`)

   - 검색 결과 섹션 컨테이너
   - 이전 답변과 AI 답변을 함께 표시

3. **PreviousAnswers** (`components/previous-answers.jsx`)

   - 이전 답변 목록 표시
   - 검색 결과 카드
   - 접기/펼치기 및 복사 기능

4. **AiAnswer** (`components/ai-answer.jsx`)

   - AI 답변 생성 및 표시
   - 답변 복사 및 재생성
   - 답변 저장 다이얼로그 열기

5. **SaveAnswerDialog** (`components/save-answer-dialog.jsx`)

   - 답변 저장 폼
   - 카테고리, 질문, 답변, 키워드 편집

6. **Logo** (`components/logo.jsx`)
   - 프로젝트 로고 및 제목

### UI 라이브러리

Radix UI 기반 컴포넌트:

- Dialog, Card, Button, Badge
- Input, Textarea, Select
- Accordion, Tabs
- Toast 알림
- 기타 40개 이상의 접근성 있는 컴포넌트

---

## 📊 데이터 구조

### Q&A 데이터베이스 스키마

**파일**: `public/data/qna-database.json`

```json
{
  "qnaList": [
    {
      "id": "qna-001",
      "category": "Frontend",
      "title": "질문 제목",
      "body": "질문 본문",
      "ocrText": "이미지에서 추출된 텍스트 (선택)",
      "ocrErrorLine": "에러 메시지 첫 줄 (선택)",
      "tags": ["React", "useState"],
      "keywords": ["React", "useState", "hooks"],
      "answer": "답변 내용",
      "author": "작성자",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "views": 0
    }
  ]
}
```

---

## ⚙️ 환경 설정

### 필수 환경 변수

`.env.local` 파일에 다음 변수 설정:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### OpenAI API 설정

1. [OpenAI Platform](https://platform.openai.com/) 접속
2. API 키 생성
3. 결제 정보 추가 (최소 $5 크레딧 필요)
4. `.env.local` 파일에 API 키 추가

**비용**:

- GPT-4o-mini: 매우 저렴한 비용
- Vision API: 이미지당 소량의 토큰 사용
- 하이브리드 시스템으로 비용 최적화

---

## 🚀 실행 방법

### 개발 환경 실행

```bash
# 의존성 설치
npm install
# 또는
pnpm install

# 개발 서버 실행
npm run dev
# 또는
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 🔄 워크플로우

### 질문 처리 흐름

1. **사용자 입력**

   - 텍스트 질문 입력 또는 이미지 붙여넣기

2. **이미지 처리** (이미지가 있는 경우)

   - OCR API 호출하여 텍스트 추출
   - 추출된 텍스트를 질문에 추가

3. **키워드 추출**

   - 하이브리드 시스템으로 키워드 추출
   - 로컬 추출 시도 → 신뢰도 확인 → 필요시 LLM 사용

4. **데이터베이스 검색**

   - 추출된 키워드로 유사도 기반 검색
   - 상위 3개 결과 반환

5. **AI 답변 생성** (사용자 요청 시)

   - OpenAI API 호출
   - 부트캠프 멘토 스타일로 답변 생성

6. **답변 저장** (사용자 요청 시)
   - 답변을 데이터베이스에 저장
   - 제목 및 태그 자동 생성

---

## 🎯 주요 알고리즘

### 1. 키워드 추출 알고리즘

**로컬 추출** (`lib/keyword-extractor.js`):

1. 기술 용어 사전 매칭 (대소문자 구분)
2. 한글/영문 명사 추출 (2글자 이상)
3. N-gram 생성 (2-gram)
4. 불용어 제거

**LLM 추출** (`lib/llm-keyword-extractor.js`):

- GPT-4o-mini를 사용한 구조화된 키워드 추출
- 한글 용어를 영문 표준 용어로 변환
- 오타 수정 및 카테고리 분류

### 키워드/카테고리 추출 상세 흐름

- 전체 파이프라인: 로컬 휴리스틱 → 한·영/오타 매핑 재추출 → 신뢰도 계산 → 기준 미달·OCR·강제 시 LLM 호출(실패 시 로컬 폴백).
- 로컬 추출 옵션: 기본 최대 키워드 20개, OCR 시 15개. N-gram 10개(OCR 5개), 명사 15개(OCR 8개). 기술 용어 우선, 짧은 단어 우선 정렬 후 자르기.
- 매핑(`lib/keyword-mapping.js`): 한글 용어(예: 리액트→React)와 오타/약어(VSC→VSCode, js→JavaScript)를 표준화한 텍스트로 재추출 후 병합(중복 제거, OCR 시 최대 15개).
- 신뢰도(`extractKeywordsHybrid`): 기술 용어 포함 여부 50점, 키워드 수 30점, 영문 비율 20점 → 0~1. 0.7 이상이면 로컬 사용, 그 외/강제/OCR이면 LLM.
- LLM 추출(`/api/extract-keywords`): system 프롬프트로 JSON 강제 응답 `{keywords, category, corrected_terms}`. 카테고리 후보: Frontend, Backend, CSS, JavaScript, Git, 도구.
- OCR 처리: 길이 150자↑에 특수문자·줄바꿈이 많으면 자동 OCR 모드. `[이미지에서 추출된 텍스트]` 마커도 OCR 전환. OCR 모드에서는 키워드/빅그램 한도를 낮추고 LLM을 강제해 품질 보정.
- 소비 지점: `lib/qna-search.js` 검색 시 하이브리드 추출→카테고리 필터→유사도 계산; `/api/qna/add`는 전달된 keywords/category만 검증·저장(추출 없음); `scripts/migrate-qna.js`/`/api/qna/add`에서 키워드·OCR 텍스트로 태그 자동 생성.

### 2. 유사도 계산 알고리즘

**Jaccard 유사도**:

```
유사도 = 교집합 크기 / 합집합 크기
```

**종합 점수 계산**:

```
총점 = (키워드 유사도 × 0.4) +
       (제목 매칭 × 0.25) +
       (본문 매칭 × 0.15) +
       (OCR 텍스트 매칭 × 0.1) +
       (답변 매칭 × 0.1)
```

### 3. 신뢰도 계산 알고리즘

**로컬 추출 신뢰도**:

- 기술 용어 포함 여부: 50점
- 키워드 개수: 30점 (3개 이상: 30점, 2개: 20점, 1개: 10점)
- 영문 키워드 비율: 20점

**임계값**: 0.7 (70점) 이상이면 로컬 결과 사용

---

## 📈 성능 최적화

### 비용 최적화

- 하이브리드 키워드 추출로 LLM 호출 최소화
- 신뢰도 기반 스마트 폴백
- 로컬 추출 우선 사용

### 속도 최적화

- 로컬 키워드 추출은 즉시 처리
- LLM 호출은 신뢰도 낮을 때만 사용
- 병렬 처리 가능한 부분 최적화

### 사용자 경험

- 로딩 상태 명확히 표시
- 에러 메시지 친절하게 안내
- 답변 복사 및 재생성 기능

---

## 🔮 향후 개선 사항

### 데이터베이스

- 현재: JSON 파일 기반 (MVP)
- 계획: Supabase (PostgreSQL)로 마이그레이션
- 이유: 확장성, 성능, 동시성 처리

### 기능 추가

- 사용자 인증 및 권한 관리
- 답변 평가 및 피드백 시스템
- 통계 및 분석 대시보드
- 다국어 지원
- 검색 히스토리
- 즐겨찾기 기능

### 성능 개선

- 캐싱 전략 도입
- 검색 인덱싱 최적화
- 이미지 압축 및 최적화
- CDN 활용

---

## 📝 라이선스

프로젝트 내부 사용 목적

---

## 👥 기여자

위니브 부트캠프 팀

---

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**마지막 업데이트**: 2024년
