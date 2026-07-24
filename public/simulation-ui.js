"use strict";

function simulationApi() {
  return window.ScamSimulation;
}

function renderScenarioCard([scenarioId, scenario]) {
  return `
    <button
      class="simulation-card"
      data-simulation="${esc(scenarioId)}"
    >
      <span class="simulation-card-top">
        <span class="simulation-avatar" aria-hidden="true">
          ${esc(scenario.avatar)}
        </span>
        <span>
          <small>${esc(scenario.category)}</small>
          <strong>${esc(scenario.title)}</strong>
        </span>
      </span>
      <span class="simulation-card-copy">
        ${esc(scenario.description)}
      </span>
      <span class="simulation-card-meta">
        <span>${esc(scenario.difficulty)}</span>
        <span>${esc(scenario.duration)}</span>
        <b>Chơi ngay →</b>
      </span>
    </button>
  `;
}

function renderSimulationChooser() {
  const scenarios = simulationApi()?.scenarios || {};

  $("#simulationStage").innerHTML = `
    <div class="simulation-intro panel">
      <div>
        <div class="panel-kicker">
          <span aria-hidden="true">✦</span>
          Phòng tập phản xạ
        </div>
        <h2>Chọn một cuộc hội thoại</h2>
        <p>
          Hãy trả lời như khi tình huống thật đang diễn ra. Sau mỗi quyết định,
          ScamCheck sẽ giải thích thủ thuật tâm lý vừa được sử dụng.
        </p>
      </div>
      <div class="simulation-note">
        <strong>An toàn tuyệt đối</strong>
        <span>Không gọi API · Không lưu câu trả lời · Có thể chơi lại</span>
      </div>
    </div>
    <div class="simulation-scenarios">
      ${Object.entries(scenarios).map(renderScenarioCard).join("")}
    </div>
  `;

  $$("[data-simulation]").forEach((button) => {
    button.onclick = () => startSimulation(button.dataset.simulation);
  });
}

function startSimulation(scenarioId) {
  const scenario = simulationApi()?.scenarios?.[scenarioId];
  if (!scenario) {
    return;
  }

  const firstNode = scenario.nodes[scenario.start];

  state.simulation = {
    scenarioId,
    nodeId: scenario.start,
    score: 50,
    step: 1,
    transcript: [{ who: "scammer", text: firstNode.message }],
    signals: [...firstNode.signals],
    feedback: null,
    pending: null,
    ending: null,
  };

  renderSimulation();
}

function renderTranscriptItem(item) {
  const role = item.who === "user" ? "user" : "scammer";
  const sender = item.who === "user" ? "Bác" : "Người gửi";

  return `
    <div class="simulation-bubble ${role}">
      <span>${sender}</span>
      ${esc(item.text)}
    </div>
  `;
}

function renderSimulationChoice(choice, index) {
  return `
    <button data-sim-choice="${index}">
      <span>${index + 1}</span>
      ${esc(choice.text)}
    </button>
  `;
}

function renderSimulationChoices(node) {
  return `
    <div class="decision-prompt">
      <span>Bác sẽ làm gì?</span>
      <p>Chọn một cách phản hồi để tiếp tục câu chuyện.</p>
    </div>
    <div class="simulation-choices">
      ${node.choices.map(renderSimulationChoice).join("")}
    </div>
  `;
}

function feedbackTone(delta) {
  if (delta > 5) {
    return "good";
  }

  if (delta < 0) {
    return "bad";
  }

  return "neutral";
}

function feedbackTitle(delta) {
  if (delta > 5) {
    return "Phản xạ tốt";
  }

  if (delta < 0) {
    return "Cẩn thận — đang vào bẫy";
  }

  return "Chưa đủ để xác minh";
}

function renderSimulationFeedback(game) {
  const { delta, text } = game.feedback;
  const scoreChange = delta > 0 ? `+${delta}` : String(delta);
  const changeLabel = delta === 0 ? "Không đổi" : `${scoreChange} điểm Khiên`;
  const nextLabel = game.pending.ending
    ? "Xem kết quả"
    : "Xem tin nhắn tiếp theo";

  return `
    <div
      class="simulation-feedback ${feedbackTone(delta)}"
      aria-live="polite"
    >
      <span>${changeLabel}</span>
      <strong>${feedbackTitle(delta)}</strong>
      <p>${esc(text)}</p>
    </div>
    <button id="continueSimulation" class="primary">
      ${nextLabel}
      <span aria-hidden="true">→</span>
    </button>
  `;
}

function renderSimulation() {
  const game = state.simulation;
  const api = simulationApi();

  if (!game || !api) {
    renderSimulationChooser();
    return;
  }

  const scenario = api.scenarios[game.scenarioId];

  if (game.ending) {
    renderSimulationEnding(scenario, game, api);
    return;
  }

  const node = scenario.nodes[game.nodeId];
  const shield = api.shieldLabel(game.score);
  const decision = game.feedback
    ? renderSimulationFeedback(game)
    : renderSimulationChoices(node);

  $("#simulationStage").innerHTML = `
    <div class="simulation-toolbar">
      <button id="leaveSimulation" class="secondary">← Đổi kịch bản</button>
      <div>
        <span>Quyết định ${game.step}</span>
        <strong>${esc(scenario.title)}</strong>
      </div>
    </div>
    <div class="simulation-layout">
      <article
        class="simulation-phone"
        aria-label="Cuộc hội thoại mô phỏng"
      >
        <header class="simulation-phone-head">
          <span class="simulation-avatar" aria-hidden="true">
            ${esc(scenario.avatar)}
          </span>
          <span>
            <strong>${esc(scenario.sender)}</strong>
            <small>Đang trò chuyện · mô phỏng</small>
          </span>
        </header>
        <div
          id="simulationLog"
          class="simulation-log"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          ${game.transcript.map(renderTranscriptItem).join("")}
        </div>
        <div class="simulation-signals">
          <span>Dấu hiệu đã lộ:</span>
          ${game.signals.map((signal) => `<b>${esc(signal)}</b>`).join("")}
        </div>
      </article>
      <aside class="simulation-decision panel">
        <div class="shield-row">
          <div>
            <small>Khiên an toàn</small>
            <strong>${esc(shield)}</strong>
          </div>
          <b>${game.score}/100</b>
        </div>
        <div
          class="shield-track"
          role="progressbar"
          aria-label="Điểm Khiên an toàn"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${game.score}"
        >
          <span style="width:${game.score}%"></span>
        </div>
        ${decision}
      </aside>
    </div>
  `;

  $("#leaveSimulation").onclick = () => {
    state.simulation = null;
    renderSimulationChooser();
  };

  $$("[data-sim-choice]").forEach((button) => {
    button.onclick = () => chooseSimulation(Number(button.dataset.simChoice));
  });

  $("#continueSimulation")?.addEventListener("click", continueSimulation);

  requestAnimationFrame(() => {
    const log = $("#simulationLog");
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  });
}

function chooseSimulation(choiceIndex) {
  const game = state.simulation;
  const api = simulationApi();

  if (!game || !api || game.feedback) {
    return;
  }

  const result = api.resolveChoice(
    game.scenarioId,
    game.nodeId,
    choiceIndex,
    game.score,
  );

  game.score = result.score;
  game.transcript.push({ who: "user", text: result.choice.reply });
  game.feedback = {
    text: result.choice.feedback,
    delta: result.choice.delta,
  };
  game.pending = {
    next: result.next,
    ending: result.endingId,
  };

  renderSimulation();
}

function continueSimulation() {
  const game = state.simulation;
  const api = simulationApi();

  if (!game?.pending || !api) {
    return;
  }

  if (game.pending.ending) {
    game.ending = api.endings[game.pending.ending];
    game.endingId = game.pending.ending;
    game.feedback = null;
    game.pending = null;
    renderSimulation();
    return;
  }

  const scenario = api.scenarios[game.scenarioId];
  const nextNode = scenario.nodes[game.pending.next];

  game.nodeId = game.pending.next;
  game.step += 1;
  game.transcript.push({ who: "scammer", text: nextNode.message });
  game.signals = [...new Set([...game.signals, ...nextNode.signals])];
  game.feedback = null;
  game.pending = null;

  renderSimulation();
}

function renderLesson(lesson) {
  return `<li>${esc(lesson)}</li>`;
}

function renderDangerAlert(game) {
  if (game.endingId !== "danger") {
    return "";
  }

  return `
    <div class="ending-alert">
      <strong>Nếu đây là tình huống thật:</strong>
      Dừng liên lạc, gọi ngân hàng qua số chính thức và lưu lại bằng chứng ngay.
    </div>
  `;
}

function renderSimulationEnding(scenario, game, api) {
  const ending = game.ending;
  const shield = api.shieldLabel(game.score);
  const icon =
    ending.tone === "safe" ? "✓" : ending.tone === "suspect" ? "!" : "×";

  $("#simulationStage").innerHTML = `
    <article class="simulation-ending ${esc(ending.tone)}">
      <div class="ending-icon" aria-hidden="true">${icon}</div>
      <p class="eyebrow">
        Kết thúc kịch bản · ${esc(scenario.category)}
      </p>
      <h2>${esc(ending.title)}</h2>
      <p>${esc(ending.body)}</p>
      <div class="ending-score">
        <span>Khiên an toàn cuối cùng</span>
        <strong>${game.score}/100 · ${esc(shield)}</strong>
      </div>
      ${renderDangerAlert(game)}
      <div class="ending-lessons">
        <h3>Ba điều cần nhớ</h3>
        <ol>${scenario.lessons.map(renderLesson).join("")}</ol>
      </div>
      <div class="ending-actions">
        <button id="replaySimulation" class="primary">
          Chơi lại kịch bản
        </button>
        <button id="chooseSimulation" class="secondary">
          Chọn kịch bản khác
        </button>
      </div>
    </article>
  `;

  $("#replaySimulation").onclick = () => startSimulation(game.scenarioId);
  $("#chooseSimulation").onclick = () => {
    state.simulation = null;
    renderSimulationChooser();
  };
}
