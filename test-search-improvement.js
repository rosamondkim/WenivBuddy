import { searchQnA } from './lib/qna-search.js';
import { extractKeywords } from './lib/keyword-extractor.js';
import fs from 'fs';

// Q&A 데이터베이스 로드
const qnaDatabase = JSON.parse(
  fs.readFileSync('./public/data/qna-database.json', 'utf-8')
);

async function testSearch() {
  console.log('='.repeat(80));
  console.log('검색 개선 테스트');
  console.log('='.repeat(80));

  // 테스트 케이스: 짧은 검색어
  const testQuery = '윈도우 cmd';

  console.log(`\n📝 검색어: "${testQuery}"\n`);

  const result = await searchQnA(
    qnaDatabase.qnaList,
    testQuery,
    'all',
    5,
    0.1, // 최소 유사도
    false
  );

  console.log('\n📊 검색 결과:\n');

  if (result.results.length === 0) {
    console.log('❌ 검색 결과가 없습니다.');
  } else {
    result.results.forEach((item, index) => {
      console.log(`${index + 1}. [${item.id}] ${item.title}`);
      console.log(`   점수: ${item.score.toFixed(4)}`);
      console.log(`   카테고리: ${item.category}`);
      console.log('');
    });
  }

  console.log('\n🔍 추출 정보:');
  console.log(`- 키워드: [${result.extractionInfo.keywords.join(', ')}]`);
  console.log(`- 소스: ${result.extractionInfo.source}`);
  console.log(`- 신뢰도: ${Math.round(result.extractionInfo.confidence * 100)}%`);

  console.log('\n' + '='.repeat(80));

  // qna-004가 결과에 있는지 확인
  const hasQna004 = result.results.some(item => item.id === 'qna-004');
  if (hasQna004) {
    console.log('✅ qna-004가 검색 결과에 포함되었습니다!');
  } else {
    console.log('❌ qna-004가 검색 결과에 포함되지 않았습니다.');
  }
  console.log('='.repeat(80));
}

testSearch().catch(console.error);
