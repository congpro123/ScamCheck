"use strict";

function quizScore() {
  return state.quizAnswers.reduce((score, answer, index) => {
    return score + (answer === quizData[index][1] ? 1 : 0);
  }, 0);
}

function saveQuizProgress() {
  save(KEYS.training, {
    quiz: state.quiz,
    answers: state.quizAnswers,
  });
}

function openQuizLesson(index, { focus = true } = {}) {
  if (index < 0 || index >= quizData.length) {
    return;
  }

  const savedAnswer = state.quizAnswers[index];

  state.quiz = index;
  state.quizChoice = savedAnswer;
  state.answered = savedAnswer !== null;
  state.quizHint = false;

  saveQuizProgress();
  renderQuiz();

  if (focus) {
    requestAnimationFrame(() => $("#trainingLessonStart")?.focus());
  }
}

function renderOutlineContent(lesson, index, completed, status) {
  const step = completed ? "✓" : index + 1;

  return `
    <span class="training-step-number" aria-hidden="true">${step}</span>
    <span class="training-step-copy">
      <strong>${esc(lesson.lessonTitle)}</strong>
      <small>${status}</small>
    </span>
  `;
}

function renderOutlineItem(lesson, index) {
  const completed = state.quizAnswers[index] !== null;
  const current = index === state.quiz;
  const status = current ? "Đang học" : completed ? "Đã học" : "Sắp tới";
  const classes = [current && "current", completed && "completed"]
    .filter(Boolean)
    .join(" ");
  const content = renderOutlineContent(lesson, index, completed, status);
  const control =
    completed || current
      ? `
        <button
          type="button"
          data-quiz-lesson="${index}"
          ${current ? 'aria-current="step"' : ""}
        >
          ${content}
        </button>
      `
      : `<div>${content}</div>`;

  return `<li class="${classes}">${control}</li>`;
}

function renderQuizOutline() {
  return `
    <ol class="training-lesson-list">
      ${quizMeta.map(renderOutlineItem).join("")}
    </ol>
  `;
}

function completionMessage(score) {
  if (score >= 8) {
    return "Bác đã có phản xạ kiểm tra rất tốt. Hãy tiếp tục giữ thói quen xác minh qua kênh chính thức.";
  }

  if (score >= 6) {
    return "Bác đã nắm được nhiều dấu hiệu quan trọng. Luyện lại một lượt sẽ giúp phản xạ chắc hơn.";
  }

  return "Mỗi lần luyện là một lần an toàn hơn. Bác hãy xem lại các quy tắc dưới đây rồi thử lại nhé.";
}

function renderTrainingRule(number, title, detail) {
  return `
    <article>
      <span aria-hidden="true">${number}</span>
      <strong>${title}</strong>
      <p>${detail}</p>
    </article>
  `;
}

function renderTrainingComplete(root, total) {
  const rules = [
    ["01", "Không đưa OTP", "Mã OTP, mật khẩu và mã PIN chỉ để bác tự dùng."],
    [
      "02",
      "Không chuyển tiền để xác minh",
      "Cơ quan thật không có “tài khoản an toàn” để điều tra.",
    ],
    [
      "03",
      "Không bấm vội",
      "Tự mở ứng dụng hoặc gõ địa chỉ chính thức thay vì bấm liên kết lạ.",
    ],
    [
      "04",
      "Gọi lại để kiểm tra",
      "Dùng số bác đã lưu, số trên thẻ hoặc trang chính thức.",
    ],
  ];

  root.innerHTML = `
    <section class="training-complete panel" tabindex="-1">
      <div class="training-complete-mark" aria-hidden="true">✓</div>
      <p class="panel-kicker">
        <span aria-hidden="true">✦</span>
        Hoàn thành 10 bài học
      </p>
      <h2>Bác đã hoàn thành khóa luyện tập</h2>
      <p>${esc(completionMessage(state.score))}</p>
      <div class="training-score-summary">
        <strong>${state.score}/${total}</strong>
        <span>tình huống nhận diện đúng</span>
      </div>
      <div
        class="training-rule-grid"
        aria-label="Bốn quy tắc an toàn cần nhớ"
      >
        ${rules.map((rule) => renderTrainingRule(...rule)).join("")}
      </div>
      <div class="training-complete-actions">
        <button id="restartTraining" class="primary">
          ↻ Luyện lại từ đầu
        </button>
        <button id="startSimulationFromTraining" class="secondary">
          Thử hội thoại mô phỏng →
        </button>
      </div>
    </section>
  `;

  $("#restartTraining").onclick = () => {
    state.quizAnswers.fill(null);
    state.score = 0;
    openQuizLesson(0);
  };

  $("#startSimulationFromTraining").onclick = () => {
    navigateToView("simulation");
  };

  requestAnimationFrame(() => $(".training-complete")?.focus());
}

function answerClass(value, correctAnswer, selected, answered) {
  if (!answered) {
    return "";
  }

  if (selected === value) {
    return value === correctAnswer ? "is-correct" : "is-incorrect";
  }

  return value === correctAnswer ? "is-correct-reveal" : "";
}

function answerStatus(value, correctAnswer, selected, answered) {
  if (!answered) {
    return "";
  }

  if (selected === value) {
    const label =
      value === correctAnswer ? "✓ Lựa chọn an toàn" : "× Bác đã chọn";
    return `<span class="training-answer-status">${label}</span>`;
  }

  return value === correctAnswer
    ? '<span class="training-answer-status">✓ Đáp án nên chọn</span>'
    : "";
}

function renderClues(clues) {
  return clues.map((clue) => `<li>${esc(clue)}</li>`).join("");
}

function renderQuizFeedback(question, meta, total, isCorrect) {
  const nextLabel = state.quiz === total - 1 ? "Xem kết quả" : "Bài tiếp theo";

  return `
    <article
      id="quizFeedback"
      class="training-feedback feedback ${isCorrect ? "correct" : "incorrect"}"
      tabindex="-1"
      aria-live="polite"
    >
      <div class="training-feedback-head">
        <span class="training-feedback-icon" aria-hidden="true">
          ${isCorrect ? "✓" : "i"}
        </span>
        <div>
          <small>${isCorrect ? "Lựa chọn an toàn" : "Mình cùng xem lại"}</small>
          <h3>${esc(meta.lessonTitle)}</h3>
        </div>
      </div>
      <p>${esc(question[2])}</p>
      <div class="training-learn-grid">
        <section>
          <h4>Dấu hiệu cần nhìn</h4>
          <ul>${renderClues(meta.clues)}</ul>
        </section>
        <section class="training-safe-action">
          <h4>Nếu gặp thật, bác nên…</h4>
          <p>${esc(meta.safeAction)}</p>
        </section>
      </div>
      <div class="training-memory-tip">
        <strong>Mẹo ghi nhớ</strong>
        <p>${esc(improvementTips[state.quiz])}</p>
      </div>
    </article>
    <div class="training-next-row">
      <span>
        Không cần ghi nhớ hết ngay. Quan trọng nhất là biết dừng lại để kiểm tra.
      </span>
      <button id="nextQuiz" class="primary">
        ${nextLabel}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  `;
}

function renderAnswerButton({
  type,
  icon,
  title,
  detail,
  correctAnswer,
  selected,
  answered,
}) {
  const className = answerClass(type, correctAnswer, selected, answered);
  const status = answerStatus(type, correctAnswer, selected, answered);

  return `
    <button
      class="training-answer ${type}-answer answer ${className}"
      data-quiz-answer="${type}"
      ${answered ? "disabled" : ""}
    >
      <span class="training-answer-icon" aria-hidden="true">${icon}</span>
      <span>
        <strong>${title}</strong>
        <small>${detail}</small>
      </span>
      ${status}
    </button>
  `;
}

function renderTrainingLesson({
  question,
  meta,
  total,
  completedCount,
  progress,
  selected,
  answered,
}) {
  const feedback = answered
    ? renderQuizFeedback(question, meta, total, selected === question[1])
    : "";
  const answers = [
    {
      type: "scam",
      icon: "!",
      title: "Có dấu hiệu lừa đảo",
      detail: "Dừng lại và kiểm tra trước khi làm theo",
    },
    {
      type: "safe",
      icon: "✓",
      title: "Có vẻ an toàn",
      detail: "Không thấy yêu cầu nguy hiểm rõ ràng",
    },
  ];

  return `
    <section
      class="training-coursebar panel"
      aria-label="Tiến độ khóa học"
    >
      <div>
        <span>Khóa học nhận diện lừa đảo</span>
        <strong>${completedCount}/${total} bài đã học</strong>
      </div>
      <div
        class="training-progress"
        role="progressbar"
        aria-label="Tiến độ luyện tập"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${progress}"
      >
        <span style="width:${progress}%"></span>
      </div>
      <b>${progress}%</b>
    </section>
    <div class="training-layout">
      <article class="training-lesson panel">
        <div class="training-lesson-head">
          <div>
            <span class="training-count">
              Bài ${state.quiz + 1} / ${total}
            </span>
          </div>
          <span class="training-no-pressure">
            Không tính giờ · Có thể xem gợi ý
          </span>
        </div>
        <div
          id="trainingLessonStart"
          class="training-scenario-label"
          tabindex="-1"
        >
          <span aria-hidden="true">◈</span>
          Tình huống vừa nhận được
        </div>
        <article
          class="training-message-card"
          aria-label="Nội dung tình huống"
        >
          <div class="training-message-head">
            <span class="training-sender-avatar" aria-hidden="true">
              ${esc(meta.sender.slice(0, 1))}
            </span>
            <span class="training-sender-copy">
              <strong>${esc(meta.sender)}</strong>
              <small>${esc(meta.detail)}</small>
            </span>
            <time>${esc(meta.time)}</time>
          </div>
          <blockquote class="quiz-message">
            <p>${esc(question[0])}</p>
          </blockquote>
        </article>
        <section class="training-question">
          <div>
            <p class="training-question-kicker">Quan sát kỹ rồi chọn</p>
            <h2 id="trainingQuestion" tabindex="-1">
              Theo bác, tình huống này thế nào?
            </h2>
          </div>
          <button
            id="quizHintButton"
            class="training-hint-button"
            type="button"
            aria-expanded="${state.quizHint}"
            aria-controls="trainingHint"
          >
            <span aria-hidden="true">◎</span>
            ${state.quizHint ? "Ẩn gợi ý" : "Xem gợi ý"}
          </button>
        </section>
        <div
          id="trainingHint"
          class="training-hint"
          tabindex="-1"
          ${state.quizHint ? "" : "hidden"}
        >
          <strong>Gợi ý quan sát</strong>
          <p>${esc(meta.hint)}</p>
        </div>
        <div
          class="quiz-options"
          role="group"
          aria-labelledby="trainingQuestion"
        >
          ${answers
            .map((answer) =>
              renderAnswerButton({
                ...answer,
                correctAnswer: question[1],
                selected,
                answered,
              }),
            )
            .join("")}
        </div>
        <div id="feedback">${feedback}</div>
      </article>
      <aside class="training-rail" aria-label="Nội dung khóa học">
        <section class="training-outline panel">
          <div class="training-rail-heading">
            <span>Tiến trình học</span>
            <strong>${completedCount} / ${total}</strong>
          </div>
          ${renderQuizOutline()}
        </section>
        <section class="training-checklist panel">
          <p class="panel-kicker">
            <span aria-hidden="true">✦</span>
            Kiểm tra nhanh
          </p>
          <h3>4 câu hỏi trước khi tin</h3>
          <ul>
            <li>
              <span aria-hidden="true">1</span>
              Có xin tiền hoặc chuyển khoản?
            </li>
            <li>
              <span aria-hidden="true">2</span>
              Có hỏi OTP hoặc mật khẩu?
            </li>
            <li>
              <span aria-hidden="true">3</span>
              Có thúc ép hoặc dọa hậu quả?
            </li>
            <li>
              <span aria-hidden="true">4</span>
              Có đường dẫn, tệp hay số lạ?
            </li>
          </ul>
          <p class="training-checklist-note">
            <strong>Chỉ cần một câu “Có”:</strong>
            hãy dừng lại và xác minh.
          </p>
        </section>
      </aside>
    </div>
  `;
}

function bindQuizEvents(total) {
  $("#quizHintButton").onclick = () => {
    state.quizHint = !state.quizHint;
    renderQuiz();

    requestAnimationFrame(() => {
      const target = state.quizHint ? $("#trainingHint") : $("#quizHintButton");
      target?.focus();
    });
  };

  $$("[data-quiz-answer]").forEach((button) => {
    button.onclick = () => {
      if (state.quizAnswers[state.quiz] !== null) {
        return;
      }

      state.quizChoice = button.dataset.quizAnswer;
      state.quizAnswers[state.quiz] = state.quizChoice;
      state.answered = true;
      state.score = quizScore();

      saveQuizProgress();
      renderQuiz();
      requestAnimationFrame(() => $("#quizFeedback")?.focus());
    };
  });

  $$("[data-quiz-lesson]").forEach((button) => {
    button.onclick = () => {
      openQuizLesson(Number(button.dataset.quizLesson));
    };
  });

  $("#nextQuiz")?.addEventListener("click", () => {
    if (state.quiz < total - 1) {
      openQuizLesson(state.quiz + 1);
      return;
    }

    state.quiz = total;
    state.quizChoice = null;
    state.answered = false;
    state.quizHint = false;

    saveQuizProgress();
    renderQuiz();
  });
}

function renderQuiz() {
  const root = $("#quiz");
  const total = quizData.length;

  state.score = quizScore();

  if (state.quiz >= total) {
    renderTrainingComplete(root, total);
    return;
  }

  const question = quizData[state.quiz];
  const meta = quizMeta[state.quiz];
  const completedCount = state.quizAnswers.filter(
    (answer) => answer !== null,
  ).length;
  const progress = Math.round((completedCount / total) * 100);

  root.innerHTML = renderTrainingLesson({
    question,
    meta,
    total,
    completedCount,
    progress,
    selected: state.quizChoice,
    answered: state.answered,
  });

  bindQuizEvents(total);
}
