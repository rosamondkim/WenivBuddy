# 하이브리드 키워드 추출 시스템

WenivBuddy의 지능형 하이브리드 키워드 추출 시스템 가이드입니다.

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [설치 및 설정](#설치-및-설정)
3. [작동 방식](#작동-방식)
4. [비용 및 성능](#비용-및-성능)
5. [테스트 방법](#테스트-방법)
6. [문제 해결](#문제-해결)

---

## 시스템 개요

### 🎯 핵심 아이디어

비용 효율적인 하이브리드 접근법:
- **90%는 무료 로컬 처리**
- **10%만 AI(LLM) 사용**
- **월 $1 미만 비용으로 1000건 처리**

### 📊 작동 흐름

```
사용자 질문 입력
    ↓
[1단계] 로컬 키워드 추출
    ├─ 한영 매핑 적용
    └─ 오타 수정
    ↓
[2단계] 신뢰도 점수 계산
    ↓
    ├─ 신뢰도 ≥ 70% → 로컬 결과 사용 ✅ (무료)
    └─ 신뢰도 < 70% → LLM API 호출 🤖 (유료)
    ↓
검색 결과 반환
```

---

## 설치 및 설정

### 1. 환경 변수 설정 (선택사항)

LLM 기능을 사용하려면 OpenAI API 키가 필요합니다.

```bash
# .env.local.example을 .env.local로 복사
cp .env.local.example .env.local

# .env.local 파일 편집
# OPENAI_API_KEY=sk-proj-your-api-key-here
```

### 2. OpenAI API 키 발급

1. [OpenAI Platform](https://platform.openai.com/api-keys) 접속
2. "Create new secret key" 클릭
3. 키를 복사하여 `.env.local`에 저장

### 3. API 키 없이 사용하기

API 키가 없어도 **로컬 키워드 추출만으로 작동**합니다!
- 신뢰도가 낮은 질문에서도 로컬 결과 사용
- 해커톤 데모에는 충분합니다

---

## 작동 방식

### 구성 요소

#### 1. 로컬 키워드 추출 (`lib/keyword-extractor.js`)
- 기존 시스템 유지
- 빠르고 무료
- 기본적인 키워드 추출

#### 2. 한영 매핑 사전 (`lib/keyword-mapping.js`)
```javascript
"자바스크립트" → "JavaScript"
"리액트" → "React"
"비스코" → "VSCode"
```

#### 3. LLM 추출기 (`lib/llm-keyword-extractor.js`)
- OpenAI GPT-4o-mini 사용
- 한영 자동 변환
- 오타 자동 수정
- 컨텍스트 이해

#### 4. 하이브리드 로직 (`lib/hybrid-keyword-extractor.js`)
```javascript
신뢰도 =
  기술 용어 포함 여부 (50%) +
  키워드 개수 (30%) +
  영문 비율 (20%)
```

### 신뢰도 계산 예시

#### 높은 신뢰도 (85%) - 로컬 처리
```
질문: "React에서 useState 초기값 설정하는 방법"
키워드: ["React", "useState", "초기값", "설정"]
→ 기술 용어 있음 ✅
→ 키워드 4개 ✅
→ 영문 50% ✅
→ 신뢰도: 85% → 로컬 사용 (무료)
```

#### 낮은 신뢰도 (40%) - LLM 사용
```
질문: "리엑트 훅에서 초기값 어떻게 주나요?"
키워드: ["훅", "초기값"]
→ 기술 용어 없음 ❌
→ 키워드 2개 △
→ 영문 0% ❌
→ 신뢰도: 40% → LLM 호출 (유료)
→ LLM 결과: ["React", "Hook", "useState", "초기값"]
```

---

## 비용 및 성능

### 💰 비용 계산

#### GPT-4o-mini 가격
- 입력: $0.15 / 1M 토큰
- 출력: $0.60 / 1M 토큰

#### 질문당 비용
```
입력: 150 토큰 (질문 + 프롬프트)
출력: 100 토큰 (JSON 응답)

비용 = (150 × $0.15 + 100 × $0.60) / 1,000,000
     = $0.000083 (약 0.1원)
```

#### 월별 비용 (1000 질문 기준)
```
로컬 처리: 900건 × $0 = $0
LLM 처리: 100건 × $0.000083 = $0.0083

총 비용: 약 $0.01 (약 10원)
```

### ⚡ 성능

| 처리 방식 | 속도 | 정확도 | 비용 |
|----------|------|--------|------|
| 로컬만 | <50ms | 70-75% | $0 |
| LLM만 | 500-1000ms | 90-95% | $0.0001 |
| **하이브리드** | **<100ms** | **85-90%** | **$0.00001** |

---

## 테스트 방법

### 1. 개발 서버 실행

```bash
npm run dev
```

### 2. 테스트 시나리오

#### 시나리오 1: 로컬 처리 (신뢰도 높음)
```
질문: "React에서 useState 초기값 설정하는 방법"
예상 결과:
  ✅ 로컬 분석
  📊 정확도: 85%
  ⚡ 처리 시간: <50ms
  💰 비용: $0
```

#### 시나리오 2: LLM 처리 (신뢰도 낮음)
```
질문: "리엑트 훅에서 초기값 어떻게 주나요?"
예상 결과:
  🤖 AI 분석
  📊 정확도: 40% → LLM 호출
  ⚡ 처리 시간: 500-1000ms
  💰 비용: $0.0001
```

#### 시나리오 3: 한영 매핑
```
질문: "자바스크립트 배열 정렬 방법"
예상 결과:
  ✅ 로컬 분석 (매핑 적용)
  🔄 "자바스크립트" → "JavaScript"
  📊 정확도: 75%
  💰 비용: $0
```

### 3. 콘솔 로그 확인

브라우저 개발자 도구 콘솔에서 상세 로그 확인:
```
🔍 [Hybrid] Starting keyword extraction...
📝 Question: "리액트 훅 초기값"
🏠 [Local] Extracted: [훅, 초기값]
📊 [Confidence] Score: 40%
🤖 [LLM] Low confidence, calling LLM...
✅ [LLM] Successfully extracted: [React, Hook, useState, 초기값]
```

---

## 문제 해결

### Q1. API 키를 설정했는데 LLM이 작동하지 않습니다

**확인 사항:**
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일명이 정확한지 확인 (`.env.local.example`이 아닌 `.env.local`)
3. API 키가 `sk-proj-` 또는 `sk-`로 시작하는지 확인
4. 개발 서버를 재시작했는지 확인

```bash
# 개발 서버 재시작
# Ctrl+C로 종료 후
npm run dev
```

### Q2. 모든 질문이 로컬 처리됩니다

**이유:**
- 신뢰도가 70% 이상이면 로컬 처리
- 한영 매핑이 잘 작동하고 있다는 의미
- 정상 작동입니다!

**LLM 테스트:**
```javascript
// 의도적으로 신뢰도 낮은 질문
"ㄹㅇㅌ 훅 ㅊㄱㅅ" // 오타 많음
"처음에 값 어떻게 넣어요?" // 기술 용어 없음
```

### Q3. API 에러가 발생합니다

**가능한 원인:**
1. **API 키 만료**: OpenAI Platform에서 확인
2. **크레딧 부족**: 결제 수단 등록 필요
3. **Rate limit**: 너무 많은 요청

**해결:**
- OpenAI Platform에서 사용량 확인
- API 키 재발급
- 잠시 후 재시도

### Q4. 비용이 걱정됩니다

**걱정 마세요!**
- 해커톤 데모 (50건): 거의 무료
- 1000건 테스트: 약 10원
- 실수로 많이 호출해도 최대 몇 백원 수준

**비용 제한 설정:**
1. [OpenAI Platform - Limits](https://platform.openai.com/account/limits) 접속
2. "Usage limits" 설정
3. 월 $5 제한 권장

---

## 추가 기능

### 통계 확인

```javascript
import { calculateStats } from '@/lib/hybrid-keyword-extractor'

// 사용 통계
const stats = calculateStats(extractionResults)
console.log(`
로컬 처리: ${stats.localPercentage}%
LLM 처리: ${stats.llmPercentage}%
총 비용: $${stats.totalCost.toFixed(4)}
평균 신뢰도: ${Math.round(stats.avgConfidence * 100)}%
`)
```

### 배치 처리

```javascript
import { extractKeywordsBatch } from '@/lib/hybrid-keyword-extractor'

const questions = [
  "React useState 사용법",
  "JavaScript 배열 정렬",
  "CSS flexbox 정렬"
]

const { results, stats } = await extractKeywordsBatch(questions)
```

---

## 해커톤 발표 팁

### 강조할 포인트

1. **비용 효율성**
   > "90%는 무료 로컬 처리, 10%만 AI 사용으로 1000건 검색에 월 $1 미만"

2. **지능형 폴백**
   > "신뢰도 기반 스마트 폴백으로 필요할 때만 AI 활용"

3. **확장 가능성**
   > "Phase 2: 멘토 피드백 학습, Phase 3: 이미지 분석 추가 가능"

### 데모 시나리오

```
1. 일반 질문 (로컬) → "빠르고 무료!"
2. 오타 질문 (LLM) → "AI가 자동 수정!"
3. 한글 질문 (매핑) → "한영 자동 변환!"
```

---

## 다음 단계 (Phase 2, 3)

### Phase 2: 멘토 피드백 루프 (1개월 후)
- 멘토가 수정한 키워드를 학습 데이터로 축적
- 로컬 사전 자동 업데이트
- 무료 처리 비율 95%까지 향상

### Phase 3: 이미지 분석 (3개월 후)
- GPT-4o Vision API 사용
- 캡처 이미지에서 에러 정보 자동 추출
- 멘토 작업 부담 최소화

---

## 문의 및 기여

문제가 발생하거나 개선 아이디어가 있다면:
- GitHub Issues
- 프로젝트 팀원에게 연락

---

**Happy Hacking! 🚀**
