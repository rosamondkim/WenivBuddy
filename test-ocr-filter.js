import { filterOCRText, extractTitleFromFilteredText, debugFilter } from './lib/ocr-text-filter.js';

// 테스트 데이터 (요구사항26.md에서 제공된 예시)
const testOCRText = `PS C:\\Users\\user\\Desktop\\바이브코딩> npm install -g @anthropic-ai/claude-code
npm : 이 시스템에서 스크립트를 실행할 수 없습니다. C:\\Program Files\\nodejs\\npm.ps1 파일을 로드할 수 없습니다. 자세한 내용은 about_Execution_Policies(https://go.microsoft.com/fwlink/?LinkID=135170)를 참조하십시오.
위치 줄:1 문자:1
+ npm install -g @anthropic-ai/claude-code
+ ~~~
    + CategoryInfo          : 보안 오류: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess
PS C:\\Users\\user\\Desktop\\바이브코딩>`;

console.log('='.repeat(80));
console.log('OCR 텍스트 필터링 테스트');
console.log('='.repeat(80));

// 디버그 모드로 실행
const debug = debugFilter(testOCRText);

console.log('\n📝 원본 텍스트:');
console.log('-'.repeat(80));
console.log(debug.original);
console.log(`\n길이: ${debug.originalLength} chars`);

console.log('\n\n🔧 정제된 텍스트:');
console.log('-'.repeat(80));
console.log(debug.filtered);
console.log(`\n길이: ${debug.filteredLength} chars`);

console.log('\n\n📊 통계:');
console.log(`- 감소율: ${debug.reduction}`);
console.log(`- 원본 줄 수: ${debug.original.split('\\n').length}`);
console.log(`- 정제 후 줄 수: ${debug.filtered.split('\\n').length}`);

console.log('\n\n📋 제안 제목:');
console.log('-'.repeat(80));
console.log(`"${debug.suggestedTitle}"`);

console.log('\n' + '='.repeat(80));

// 추가 테스트: 다양한 에러 패턴
console.log('\n📝 추가 테스트 케이스:\n');

const testCases = [
  {
    name: 'Python Traceback',
    text: `$ python test.py
Traceback (most recent call last):
  File "test.py", line 10, in <module>
    result = divide(10, 0)
  File "test.py", line 5, in divide
    return a / b
ZeroDivisionError: division by zero`
  },
  {
    name: 'Git Error',
    text: `$ git push origin main
error: failed to push some refs to 'https://github.com/user/repo.git'
hint: Updates were rejected because the remote contains work that you do not have locally.`
  },
  {
    name: 'NPM Error',
    text: `$ npm start
npm ERR! Missing script: "start"
npm ERR!
npm ERR! To see a list of scripts, run:
npm ERR!   npm run`
  }
];

testCases.forEach(({ name, text }) => {
  console.log(`\n${name}:`);
  console.log('-'.repeat(40));
  const filtered = filterOCRText(text);
  const title = extractTitleFromFilteredText(filtered);
  console.log(`정제: ${filtered}`);
  console.log(`제목: "${title}"`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ 테스트 완료!');
console.log('='.repeat(80));
