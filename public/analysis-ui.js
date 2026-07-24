"use strict";

const INPUT_LIMIT_WARNING =
  "Bác đã nhập đủ giới hạn 6.000 ký tự. Hãy rút gọn nội dung trước khi thêm thông tin mới.";
$("#message").oninput = (event) => {
  const length = event.target.value.length;
  $("#counter").textContent = `${length} / 6000`;

  if (length >= 6000) {
    friendlyError(INPUT_LIMIT_WARNING);
  } else if ($("#error").textContent === INPUT_LIMIT_WARNING) {
    friendlyError("");
  }
};

$$(".sample").forEach((button) => {
  button.onclick = () => {
    $("#message").value = samples[button.dataset.sample];
    $("#message").dispatchEvent(new Event("input"));
    $("#message").focus();
  };
});

function setBusy(isBusy) {
  $("#loading").hidden = !isBusy;
  $("#analyze").disabled = isBusy;
  $("#speak").disabled = isBusy;
}

function friendlyError(message) {
  $("#error").textContent = message;
  $("#error").hidden = !message;
}

async function post(url, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Yêu cầu thất bại.");
    }

    return payload;
  } finally {
    clearTimeout(timer);
  }
}

$("#analyze").onclick = async () => {
  clearPreviousResult();

  const text = $("#message").value.trim();
  if (text.length < 4) {
    return friendlyError("Bác hãy nhập một tin nhắn dài hơn một chút.");
  }

  const cache = load(KEYS.cache, []);
  const key = hash(text);
  const cachedResult = cache.find((entry) => entry.key === key);

  if (cachedResult) {
    state.analysis = cachedResult.data;
    state.text = text;
    renderResult(cachedResult.data, true);
    return;
  }

  if (state.uses >= LIMIT) {
    return friendlyError(
      `Bác đã dùng hết ${LIMIT} lượt AI trong phiên. Tin đã xem vẫn có trong Lịch sử.`,
    );
  }

  setBusy(true);
  $("#streamStatus").textContent =
    "Thám tử đang phân tích cấu trúc và đường dẫn…";
  state.uses += 1;
  $("#usage").textContent =
    `Đã dùng ${state.uses} / ${LIMIT} lượt AI trong phiên`;

  const startedAt = Date.now();

  try {
    const data = await post("/api/analyze", { text });
    state.analysis = data;
    state.text = text;

    const updatedCache = [
      { key, data },
      ...cache.filter((entry) => entry.key !== key),
    ].slice(0, 30);

    save(KEYS.cache, updatedCache);
    saveHistory(text, data);
    logCall(text, data, Date.now() - startedAt);
    renderResult(data, false);
  } catch (error) {
    friendlyError(
      error.name === "AbortError"
        ? "Quá thời gian chờ. Bác thử lại sau ít phút nhé."
        : "Không kết nối được máy chủ. Bác kiểm tra mạng rồi thử lại.",
    );
  } finally {
    setBusy(false);
  }
};

function logCall(text, data, durationMs) {
  const logs = load(KEYS.logs, []);

  logs.push({
    at: new Date().toISOString(),
    inputLength: text.length,
    risk: data.detective.risk,
    signals: data.detective.signals.length,
    durationMs,
    ai: data.meta?.ai,
  });

  save(KEYS.logs, logs);
}

function saveHistory(text, data) {
  const key = hash(text);
  const history = load(KEYS.history, []).filter((entry) => entry.key !== key);

  history.unshift({ key, at: Date.now(), text, data });
  save(KEYS.history, history.slice(0, 10));
}

function highlight(text, signals) {
  let chunks = [{ text, matched: false }];

  for (const signal of signals) {
    if (!signal.quote) {
      continue;
    }

    chunks = chunks.flatMap((chunk) => {
      if (chunk.matched) {
        return [chunk];
      }

      const index = chunk.text
        .toLocaleLowerCase()
        .indexOf(signal.quote.toLocaleLowerCase());

      return index < 0
        ? [chunk]
        : [
            { text: chunk.text.slice(0, index), matched: false },
            {
              text: chunk.text.slice(index, index + signal.quote.length),
              matched: true,
            },
            {
              text: chunk.text.slice(index + signal.quote.length),
              matched: false,
            },
          ];
    });
  }

  return chunks
    .map((chunk) =>
      chunk.matched ? `<mark>${esc(chunk.text)}</mark>` : esc(chunk.text),
    )
    .join("");
}

function riskClass(risk) {
  if (risk === "An toàn") {
    return "safe";
  }

  if (risk === "Nghi ngờ") {
    return "suspect";
  }

  return "danger";
}

function resultSource(data, cached) {
  if (cached) {
    return "Kết quả được lấy từ dữ liệu đã lưu trước đó — không tốn lượt AI";
  }

  return data.meta?.ai
    ? "Đã phân tích bằng AI + lớp luật"
    : "Kết quả từ lớp luật an toàn";
}

function renderRiskSummary(data, cached) {
  const risk = data.detective.risk;

  return `
    <div class="risk ${riskClass(risk)}">
      <p>Kết luận của Thám tử</p>
      <h2>${esc(risk)}</h2>
      <span>${resultSource(data, cached)}</span>
    </div>
  `;
}

function renderUrlWarning(url) {
  return `
    <div class="url-warning">
      <strong>Cảnh báo ${esc(url.host)}</strong>
      <br>
      ${esc(url.reason)}
    </div>
  `;
}

function renderMarkedMessage(detective, suspiciousUrls) {
  return `
    <article class="result-card">
      <h2>Tin đã đánh dấu</h2>
      <p>${highlight(state.text, detective.signals)}</p>
      ${suspiciousUrls.map(renderUrlWarning).join("")}
    </article>
  `;
}

function renderSignal(signal) {
  const quote = signal.quote ? `<br><q>${esc(signal.quote)}</q>` : "";
  return `<li><strong>${esc(signal.reason)}</strong>${quote}</li>`;
}

function renderSignals(detective) {
  const items = detective.signals.length
    ? detective.signals.map(renderSignal).join("")
    : "<li>Chưa thấy dấu hiệu lừa đảo rõ ràng. Vẫn kiểm tra người gửi nếu bác chưa chắc chắn.</li>";

  return `
    <article class="result-card">
      <h2>Dấu hiệu phát hiện</h2>
      <ul class="signals">${items}</ul>
    </article>
  `;
}

function renderGuidance(data) {
  const { detective } = data;

  if (detective.risk === "An toàn") {
    const reminder =
      data.local?.securityAdvice || detective.signals.length
        ? detective.actions[0]
        : "";

    return reminder
      ? `
        <article class="result-card">
          <h2>Lưu ý</h2>
          <p>${esc(reminder)}</p>
        </article>
      `
      : "";
  }

  const actions = detective.actions
    .slice(0, 3)
    .map((action) => `<li>${esc(action)}</li>`)
    .join("");

  return `
    <article class="result-card">
      <h2>3 việc nên làm</h2>
      <ol class="actions">${actions}</ol>
    </article>
  `;
}

function renderPsychology(data) {
  const explanation = data.psychology
    ? `
      <article class="result-card">
        <h2>Góc nhìn tâm lý</h2>
        <p>${esc(data.psychology.explanation)}</p>
      </article>
    `
    : "";
  const error = data.psychologyError
    ? `<div class="notice">${esc(data.psychologyError)}</div>`
    : "";

  return explanation + error;
}

function renderEmergency(detective) {
  if (detective.risk === "An toàn") {
    return "";
  }

  return `
    <article class="result-card">
      <h2>Bác đã làm gì rồi?</h2>
      <p>Chọn một đáp án để nhận hướng dẫn ứng cứu phù hợp.</p>
      <div class="scenario-grid">
        <button data-scenario="none">Chưa làm gì</button>
        <button data-scenario="clicked">Đã bấm đường dẫn</button>
        <button data-scenario="shared">Đã đưa thông tin / OTP</button>
        <button data-scenario="paid">Đã chuyển tiền</button>
      </div>
      <div id="response"></div>
    </article>
  `;
}

function renderShareCard(detective) {
  if (detective.risk === "An toàn") {
    return "";
  }

  return `
    <article class="result-card">
      <h2>Chia sẻ cảnh báo</h2>
      <canvas
        id="shareCard"
        class="share-canvas"
        width="1080"
        height="1080"
      ></canvas>
      <p>
        <button id="downloadCard" class="primary">
          Lưu hoặc chia sẻ ảnh
        </button>
      </p>
    </article>
  `;
}

function renderResult(data, cached) {
  const { detective } = data;
  const suspiciousUrls = (data.local?.urls || []).filter(
    (url) => url.suspicious,
  );
  const result = $("#result");

  result.innerHTML = [
    renderRiskSummary(data, cached),
    renderMarkedMessage(detective, suspiciousUrls),
    renderSignals(detective),
    renderGuidance(data),
    renderPsychology(data),
    renderEmergency(detective),
    renderShareCard(detective),
  ].join("");
  result.hidden = false;

  $$("[data-scenario]").forEach((button) => {
    button.onclick = () => respond(button);
  });

  if (detective.risk !== "An toàn") {
    drawCard(detective);
    $("#downloadCard").onclick = downloadCard;
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  result.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
}

function renderResponseContact(contact) {
  return `
    <li>
      <a href="tel:${esc(contact.phone)}">
        <strong>${esc(contact.phone)}</strong>
      </a>
      — ${esc(contact.name)}
      <br>
      <span>${esc(contact.purpose)}</span>
    </li>
  `;
}

function renderResponseStep(step) {
  const needsScript =
    /(gọi|liên hệ|trình báo|phản ánh|báo cho|yêu cầu|đề nghị)/iu.test(
      step.action,
    );
  const script =
    needsScript && step.script
      ? `<br><em>Câu nói mẫu: “${esc(step.script)}”</em>`
      : "";

  return `<li><strong>${esc(step.action)}</strong>${script}</li>`;
}

function renderResponseContacts(contacts) {
  if (!contacts.length) {
    return "";
  }

  return `
    <section class="response-contacts" aria-labelledby="contactTitle">
      <h3 id="contactTitle">Số cần gọi</h3>
      <ul>${contacts.map(renderResponseContact).join("")}</ul>
      <p>
        <small>
          Ưu tiên số trong ứng dụng chính thức hoặc mặt sau thẻ ngân hàng.
          Không gọi số do người lạ gửi.
        </small>
      </p>
    </section>
  `;
}

function renderNoActionAdvice() {
  return `
    <section class="response-safe" aria-labelledby="safeResponseTitle">
      <h3 id="safeResponseTitle">Bác đã dừng đúng lúc — rất tốt!</h3>
      <p>
        Vì bác chưa bấm đường dẫn, chưa cung cấp thông tin và chưa chuyển tiền,
        nguy cơ hiện tại đã được hạn chế đáng kể.
      </p>
      <ul>
        <li>Không trả lời tin nhắn, không bấm liên kết và không cung cấp OTP.</li>
        <li>
          Nếu nội dung nhắc đến ngân hàng hoặc người thân, hãy tự mở ứng dụng
          chính thức hoặc gọi số bác đã lưu để xác minh.
        </li>
        <li>
          Chụp lại tin nhắn nếu cần làm bằng chứng, sau đó chặn người gửi và
          cảnh báo người thân.
        </li>
      </ul>
      <p class="safe-reminder">
        <strong>Nhớ nhé:</strong>
        cứ thấy thúc giục, xin tiền hoặc hỏi mã bí mật thì dừng lại kiểm tra.
      </p>
    </section>
  `;
}

async function respond(button) {
  $$("[data-scenario]").forEach((scenarioButton) => {
    scenarioButton.disabled = true;
  });

  button.classList.add("selected");

  if (button.dataset.scenario === "none") {
    $("#response").innerHTML = renderNoActionAdvice();
    return;
  }

  $("#response").innerHTML = "<p>Đang chuẩn bị các bước khẩn cấp…</p>";

  try {
    const data = await post("/api/respond", {
      text: state.text,
      scenario: button.dataset.scenario,
    });

    $("#response").innerHTML = `
      <h3>Các bước ứng cứu cụ thể</h3>
      <ol class="steps">${data.steps.map(renderResponseStep).join("")}</ol>
      ${renderResponseContacts(data.contacts || [])}
    `;
  } catch {
    $("#response").innerHTML =
      '<p class="notice error">Chưa tải được hướng dẫn. Nếu đã mất tiền, gọi ngay số chính thức trong ứng dụng hoặc mặt sau thẻ ngân hàng, chuẩn bị mã giao dịch và đến công an gần nhất.</p>';
  }
}
function loadCanvasImage(source, crossOrigin) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    if (crossOrigin) {
      image.crossOrigin = crossOrigin;
    }

    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function resultColor(risk) {
  if (risk === "An toàn") {
    return "#18b785";
  }

  if (risk === "Nghi ngờ") {
    return "#d98a26";
  }

  return "#ef5671";
}

function drawWrappedText(context, text, startX, startY, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = startY;

  for (const word of words) {
    const candidate = `${line}${word}`;

    if (context.measureText(candidate).width > maxWidth) {
      context.fillText(line, startX, currentY);
      line = `${word} `;
      currentY += lineHeight;
      continue;
    }

    line = `${candidate} `;
  }

  context.fillText(line, startX, currentY);
}

async function drawCard(detective) {
  const canvas = $("#shareCard");
  const context = canvas.getContext("2d");
  const background = context.createLinearGradient(0, 0, 1080, 1080);
  const glow = context.createRadialGradient(900, 120, 10, 900, 120, 520);

  background.addColorStop(0, "#111a42");
  background.addColorStop(0.5, "#080d25");
  background.addColorStop(1, "#040611");
  context.fillStyle = background;
  context.fillRect(0, 0, 1080, 1080);

  glow.addColorStop(0, "rgba(159,103,255,.55)");
  glow.addColorStop(0.55, "rgba(96,120,255,.16)");
  glow.addColorStop(1, "rgba(5,7,21,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 1080, 1080);

  try {
    const logo = await loadCanvasImage("./logo.svg");
    context.drawImage(logo, 64, 53, 74, 74);
  } catch {}

  context.fillStyle = "#fff";
  context.font = "800 48px Manrope, sans-serif";
  context.fillText("ScamCheck", 158, 103);
  context.fillStyle = "rgba(255,255,255,.6)";
  context.font = "700 20px Manrope, sans-serif";
  context.fillText("SAFE DIGITAL SPACE", 159, 133);
  context.fillStyle = "rgba(255,255,255,.07)";
  context.strokeStyle = "rgba(191,201,255,.2)";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(70, 190, 940, 190, 28);
  context.fill();
  context.stroke();
  context.fillStyle = resultColor(detective.risk);
  context.beginPath();
  context.roundRect(70, 190, 12, 190, 8);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.62)";
  context.font = "800 22px Manrope, sans-serif";
  context.fillText("KẾT QUẢ KIỂM TRA", 110, 245);
  context.fillStyle = "#fff";
  context.font = "800 76px Manrope, sans-serif";
  context.fillText(detective.risk, 110, 330);
  context.font = "800 38px Manrope, sans-serif";
  context.fillText("Dấu hiệu chính", 70, 470);
  context.fillStyle = "rgba(230,234,255,.82)";
  context.font = "500 32px Manrope, sans-serif";
  drawWrappedText(
    context,
    detective.signals[0]?.reason || "Chưa thấy dấu hiệu rõ ràng",
    70,
    530,
    690,
    47,
  );
  context.fillStyle = "rgba(81,228,213,.12)";
  context.strokeStyle = "rgba(81,228,213,.3)";
  context.beginPath();
  context.roundRect(70, 700, 650, 150, 24);
  context.fill();
  context.stroke();
  context.fillStyle = "#dffdfa";
  context.font = "600 27px Manrope, sans-serif";
  drawWrappedText(
    context,
    "Hãy tự liên hệ tổ chức qua kênh chính thức. Không cung cấp OTP hoặc chuyển tiền.",
    98,
    755,
    590,
    40,
  );
  context.font = "500 23px Manrope, sans-serif";
  context.fillStyle = "rgba(210,218,246,.58)";
  context.fillText(location.origin, 70, 1000);

  try {
    const qrCode = await loadCanvasImage("/api/qr", "anonymous");
    context.fillStyle = "#fff";
    context.beginPath();
    context.roundRect(770, 695, 250, 300, 22);
    context.fill();
    context.drawImage(qrCode, 785, 710, 220, 220);
    context.fillStyle = "#080d25";
    context.font = "800 20px Manrope, sans-serif";
    context.textAlign = "center";
    context.fillText("Quét để kiểm tra", 895, 965);
    context.textAlign = "left";
  } catch {}
}

async function downloadCard() {
  const canvas = $("#shareCard");

  if (!canvas) {
    return;
  }

  const fileName = `scamcheck-${Date.now()}.png`;
  const imageBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!imageBlob) {
    friendlyError("Chưa tạo được ảnh. Bác thử lại nhé.");
    return;
  }

  const imageFile = new File([imageBlob], fileName, {
    type: "image/png",
  });
  const canShareFile =
    navigator.share &&
    navigator.canShare?.({
      files: [imageFile],
    });

  if (canShareFile) {
    try {
      await navigator.share({
        files: [imageFile],
        title: "Cảnh báo ScamCheck",
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  const imageUrl = URL.createObjectURL(imageBlob);
  const downloadLink = document.createElement("a");
  downloadLink.download = fileName;
  downloadLink.href = imageUrl;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
}
