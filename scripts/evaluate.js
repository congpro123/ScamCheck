'use strict';
// Đọc bộ 60 tin có nhãn và chạy lớp luật độc lập với Gemini.
const data=require('../datasets/evaluation.json');const {analyzeWithRules}=require('../src/analysis');
// Ma trận có hàng là nhãn thật và cột là nhãn dự đoán.
const labels=['An toàn','Nghi ngờ','Nguy hiểm'];const matrix=Object.fromEntries(labels.map(a=>[a,Object.fromEntries(labels.map(b=>[b,0]))]));let correct=0,dangerCaught=0,dangerTotal=0;
// Vòng lặp vừa in từng ca vừa cộng accuracy và recall cảnh báo nguy hiểm.
for(const x of data){const predicted=analyzeWithRules(x.text).risk;matrix[x.label][predicted]++;correct+=predicted===x.label;if(x.label==='Nguy hiểm'){dangerTotal++;dangerCaught+=predicted!=='An toàn'}console.log(`${predicted===x.label?'✓':'✗'} ${x.id.padEnd(4)} ${x.label.padEnd(10)} → ${predicted}`)}
// Báo cáo cuối giúp so sánh chất lượng sau mỗi lần chỉnh luật/prompt.
console.log('\nMa trận nhầm lẫn (thực tế → dự đoán)');console.table(matrix);console.log(`Độ chính xác luật: ${(correct/data.length*100).toFixed(1)}%`);console.log(`Độ phủ cảnh báo Nguy hiểm: ${(dangerCaught/dangerTotal*100).toFixed(1)}%`);console.log('\nĐiểm yếu: (1) ngữ cảnh đời thường khó xác minh; (2) mỉa mai/ẩn dụ; (3) lừa đảo không chứa từ khoá. Lớp Gemini bổ sung hiểu ngữ nghĩa cho các ca này.');
