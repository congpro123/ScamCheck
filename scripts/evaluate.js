"use strict";

const evaluationCases = require("../datasets/evaluation.json");
const { analyzeWithRules } = require("../src/analysis");

const labels = ["An toàn", "Nghi ngờ", "Nguy hiểm"];
const matrix = Object.fromEntries(
  labels.map((actualLabel) => [
    actualLabel,
    Object.fromEntries(labels.map((predictedLabel) => [predictedLabel, 0])),
  ]),
);

let correctPredictions = 0;
let detectedDangerCases = 0;
let totalDangerCases = 0;

for (const evaluationCase of evaluationCases) {
  const predictedLabel = analyzeWithRules(evaluationCase.text).risk;
  const isCorrect = predictedLabel === evaluationCase.label;

  matrix[evaluationCase.label][predictedLabel] += 1;
  correctPredictions += Number(isCorrect);

  if (evaluationCase.label === "Nguy hiểm") {
    totalDangerCases += 1;
    detectedDangerCases += Number(predictedLabel !== "An toàn");
  }

  console.log(
    `${isCorrect ? "✓" : "✗"} ${evaluationCase.id.padEnd(4)} ${evaluationCase.label.padEnd(10)} → ${predictedLabel}`,
  );
}

const accuracy = (correctPredictions / evaluationCases.length) * 100;
const dangerCoverage = (detectedDangerCases / totalDangerCases) * 100;

console.log("\nMa trận nhầm lẫn (thực tế → dự đoán)");
console.table(matrix);
console.log(`Độ chính xác luật: ${accuracy.toFixed(1)}%`);
console.log(`Độ phủ cảnh báo Nguy hiểm: ${dangerCoverage.toFixed(1)}%`);
console.log(
  "\nĐiểm yếu: (1) ngữ cảnh đời thường khó xác minh; (2) mỉa mai/ẩn dụ; (3) lừa đảo không chứa từ khoá. Lớp Gemini bổ sung hiểu ngữ nghĩa cho các ca này.",
);
