# Q&A 데이터베이스 - 카테고리별 관리 가이드

## 📁 폴더 구조

```
public/data/
├── qna-database.json          # 전체 Q&A 데이터 (통합본)
└── categories/                # 카테고리별 분리 데이터
    ├── README.md              # 이 파일
    ├── stats.json             # 카테고리별 통계
    ├── frontend.json          # Frontend 카테고리
    ├── backend.json           # Backend 카테고리
    ├── css.json               # CSS 카테고리
    ├── javascript.json        # JavaScript 카테고리
    ├── git.json               # Git 카테고리
    └── tools.json             # 도구 카테고리
```

---

## 🎯 왜 카테고리별로 나눴나요?

### 문제점

- Q&A 데이터가 많아지면 하나의 파일에서 관리하기 어려움
- 특정 분야의 Q&A만 확인하기 불편함
- 파일이 커지면서 로딩 속도 저하

### 해결책

- **카테고리별 파일 분리**: 각 분야별로 독립적인 JSON 파일 관리
- **통계 자동 생성**: stats.json으로 한눈에 현황 파악
- **선택적 로딩**: 필요한 카테고리만 로드 가능 (향후 구현)

---

## 📊 현재 통계 (2024-12-04 기준)

| 카테고리   | Q&A 수  | 총 조회수 | 최근 업데이트 |
| ---------- | ------- | --------- | ------------- |
| CSS        | 2개     | 290회     | 2024-12-04    |
| 도구       | 2개     | 120회     | 2024-12-03    |
| Backend    | 1개     | 121회     | 2024-12-03    |
| JavaScript | 1개     | 93회      | 2024-12-03    |
| Frontend   | 1개     | 87회      | 2024-12-02    |
| Git        | 1개     | 67회      | 2024-12-03    |
| **전체**   | **8개** | **778회** | -             |

---

## ✏️ 새로운 Q&A 추가 방법

### 1단계: 카테고리 선택

해당하는 카테고리 파일을 선택하세요:

- Frontend 관련 → `frontend.json`
- Backend 관련 → `backend.json`
- CSS 관련 → `css.json`
- JavaScript 관련 → `javascript.json`
- Git 관련 → `git.json`
- VSCode, 도구 관련 → `tools.json`

### 2단계: 데이터 추가

해당 카테고리 파일의 `qnaList` 배열에 새로운 객체를 추가하세요.

```json
{
  "id": "qna-009",
  "category": "Frontend",
  "question": "질문 내용",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "answer": "답변 내용",
  "author": "작성자 이름",
  "timestamp": "2024-12-04T10:00:00",
  "imageUrl": "/images/example.png",
  "views": 0
}
```

### 3단계: 전체 데이터베이스 업데이트

모든 카테고리 파일의 데이터를 `qna-database.json`에도 반영하세요.

또는 자동화 스크립트를 사용하세요 (향후 구현 예정):

```bash
npm run merge-qna
```

### 4단계: 통계 업데이트

`stats.json` 파일의 카테고리별 통계를 업데이트하세요:

- `count`: Q&A 개수
- `views`: 총 조회수
- `latestUpdate`: 최근 업데이트 날짜

---

## 🔧 데이터 구조

### Q&A 항목 필수 필드

| 필드        | 타입   | 설명                | 예시                  |
| ----------- | ------ | ------------------- | --------------------- |
| `id`        | string | 고유 ID             | "qna-009"             |
| `category`  | string | 카테고리명          | "Frontend"            |
| `question`  | string | 질문 내용           | "React에서..."        |
| `keywords`  | array  | 키워드 배열         | ["React", "useState"] |
| `answer`    | string | 답변 내용           | "useState는..."       |
| `author`    | string | 작성자              | "김코딩 강사"         |
| `timestamp` | string | 작성일시 (ISO 8601) | "2024-12-04T10:00:00" |
| `imageUrl`  | string | 이미지 경로         | "/images/example.png" |
| `views`     | number | 조회수              | 0                     |

---

## 📝 카테고리 정의

### Frontend

- React, Vue, Angular 등 프론트엔드 프레임워크
- 컴포넌트, 상태 관리, 라우팅 등

### Backend

- Node.js, Express, NestJS 등 백엔드 프레임워크
- 미들웨어, API, 데이터베이스 연동 등

### CSS

- Flexbox, Grid, Position 등 CSS 레이아웃
- 애니메이션, 반응형 디자인 등

### JavaScript

- async/await, Promise, 클로저 등 JS 핵심 개념
- ES6+ 문법, 이벤트 처리 등

### Git

- Git 명령어, 브랜치 관리, 협업 등
- GitHub, GitLab 사용법

### 도구 (tools)

- VSCode, Chrome DevTools 등 개발 도구
- 확장 프로그램, 단축키, 설정 등

---

## 🚀 향후 개선 사항

### 자동화 스크립트 (예정)

````bash ㅖ
# 카테고리별 파일을 하나로 합치기
npm run merge-qna

# 통계 자동 생성
npm run generate-stats

# 새 Q&A 추가 CLI
npm run add-qna -- --category=Frontend --question="질문"
``` ㅖㅡ

### 검증 스크립트 (예정)
- 중복 ID 체크
- 필수 필드 검증
- 키워드 일관성 검사
- 카테고리 유효성 검증

### 선택적 로딩 (예정)
```javascript
// 특정 카테고리만 로드
const frontendQnA = await loadQnAByCategory('Frontend');

// 여러 카테고리 동시 로드
const techQnA = await loadQnAByCategories(['Frontend', 'Backend', 'JavaScript']);
````

---

## 💡 팁

1. **Q&A 추가 시**: 관련성 높은 키워드 3-7개를 추가하세요
2. **카테고리 선택**: 애매한 경우 주요 기술 스택을 기준으로 선택
3. **ID 규칙**: `qna-` 접두사 + 3자리 숫자 (예: qna-009)
4. **타임스탬프**: ISO 8601 형식 사용 (YYYY-MM-DDTHH:mm:ss)
5. **이미지**: `/images/` 폴더에 저장하고 경로만 기록

---

## 📞 문의

Q&A 데이터베이스 관리에 대한 문의사항은 개발팀에 문의하세요.
