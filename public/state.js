"use strict";

const savedTraining = load(KEYS.training, {});
const savedQuizAnswers =
  Array.isArray(savedTraining.answers) &&
  savedTraining.answers.length === quizData.length
    ? savedTraining.answers.map((answer) =>
        answer === "safe" || answer === "scam" ? answer : null,
      )
    : Array(quizData.length).fill(null);
let savedQuiz =
  Number.isInteger(savedTraining.quiz) &&
  savedTraining.quiz >= 0 &&
  savedTraining.quiz <= quizData.length
    ? savedTraining.quiz
    : 0;
if (
  savedQuiz === quizData.length &&
  savedQuizAnswers.some((answer) => answer === null)
) {
  savedQuiz = savedQuizAnswers.findIndex((answer) => answer === null);
}

const state = {
  uses: 0,
  analysis: null,
  text: "",
  quiz: savedQuiz,
  score: 0,
  answered: savedQuiz < quizData.length && savedQuizAnswers[savedQuiz] !== null,
  quizHint: false,
  quizChoice: savedQuiz < quizData.length ? savedQuizAnswers[savedQuiz] : null,
  quizAnswers: savedQuizAnswers,
  simulation: null,
};
