import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'public', 'data', 'qna-database.json');
const backupPath = path.join(process.cwd(), 'public', 'data', 'qna-database.backup.json');

const categoryMapping = {
  'Frontend': 'Front-end',
  'Backend': 'Back-end',
  'CSS': 'Front-end',
  'JavaScript': 'Front-end',
  'Git': 'Git/GitHub',
  '도구': 'Terminal',
};

try {
  // 1. 데이터베이스 파일 읽기
  const fileContent = fs.readFileSync(dbPath, 'utf-8');
  const qnaData = JSON.parse(fileContent);

  // 2. 백업 생성
  fs.writeFileSync(backupPath, fileContent, 'utf-8');
  console.log(`✅ Backup created at: ${backupPath}`);

  let updatedCount = 0;

  // 3. 카테고리 업데이트
  const updatedQnaList = qnaData.qnaList.map(qna => {
    const oldCategory = qna.category;
    if (oldCategory in categoryMapping) {
      const newCategory = categoryMapping[oldCategory];
      if (oldCategory !== newCategory) {
        updatedCount++;
        console.log(`  Updating category: ${oldCategory} -> ${newCategory} (for ID: ${qna.id})`);
        return { ...qna, category: newCategory };
      }
    }
    // 매핑에 없는 카테고리는 그대로 둠
    return qna;
  });

  // 4. 변경된 내용으로 데이터 업데이트
  const updatedData = { ...qnaData, qnaList: updatedQnaList };

  // 5. 파일에 다시 쓰기
  fs.writeFileSync(dbPath, JSON.stringify(updatedData, null, 2), 'utf-8');

  console.log(`
🎉 Category migration complete!`);
  console.log(`Total items processed: ${qnaData.qnaList.length}`);
  console.log(`Total items updated: ${updatedCount}`);

} catch (error) {
  console.error('❌ An error occurred during category migration:');
  console.error(error);
  console.log('👉 Restore from backup if necessary:', backupPath);
}
