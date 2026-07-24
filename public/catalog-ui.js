"use strict";

function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function renderHistoryCard(entry, index) {
  return `
    <article class="history-card">
      <small>${formatDateTime(entry.at)}</small>
      <h2>${esc(entry.data.detective.risk)}</h2>
      <p>${esc(entry.text.slice(0, 180))}</p>
      <button class="secondary open-history" data-index="${index}">
        Xem lại
      </button>
      <button class="danger delete-history" data-index="${index}">
        Xoá
      </button>
    </article>
  `;
}

function renderLogRow(entry) {
  return `
    <tr>
      <td>${formatDateTime(entry.at)}</td>
      <td>${entry.inputLength}</td>
      <td>${esc(entry.risk)}</td>
      <td>${entry.durationMs} ms</td>
      <td>${entry.ai ? "Gemini + luật" : "Luật"}</td>
    </tr>
  `;
}

function renderCallLogs(logs) {
  if (!logs.length) {
    return "<p>Chưa có lần gọi nào trong phiên.</p>";
  }

  return `
    <div
      class="log-table"
      role="region"
      aria-label="Nhật ký gọi AI"
      tabindex="0"
    >
      <table>
        <thead>
          <tr>
            <th>Ngày và giờ</th>
            <th>Ký tự</th>
            <th>Kết quả</th>
            <th>Thời gian xử lý</th>
            <th>Nguồn</th>
          </tr>
        </thead>
        <tbody>${logs.map(renderLogRow).join("")}</tbody>
      </table>
    </div>
  `;
}

function openHistoryEntry(index) {
  const entry = load(KEYS.history, [])[index];
  if (!entry) {
    return;
  }

  state.text = entry.text;
  state.analysis = entry.data;
  $("#message").value = entry.text;
  navigateToView("home");
  renderResult(entry.data, true);
}

function deleteHistoryEntry(index) {
  if (!confirm("Xoá tin này khỏi lịch sử?")) {
    return;
  }

  const history = load(KEYS.history, []);
  history.splice(index, 1);
  save(KEYS.history, history);
  renderHistory();
}

function renderHistory() {
  const history = load(KEYS.history, []);
  const historyList = $("#historyList");

  historyList.innerHTML = history.length
    ? history.map(renderHistoryCard).join("")
    : '<div class="panel"><p>Chưa có tin nào được lưu.</p></div>';

  $("#callLogs").innerHTML = renderCallLogs(load(KEYS.logs, []));

  $$(".open-history").forEach((button) => {
    button.onclick = () => openHistoryEntry(Number(button.dataset.index));
  });

  $$(".delete-history").forEach((button) => {
    button.onclick = () => deleteHistoryEntry(Number(button.dataset.index));
  });
}

$("#clearHistory").onclick = () => {
  if (!confirm("Xoá toàn bộ lịch sử? Hành động này không thể hoàn tác.")) {
    return;
  }

  save(KEYS.history, []);
  renderHistory();
};

$("#exportLogs").onclick = () => {
  const content = JSON.stringify(load(KEYS.logs, []), null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "scamcheck-ai-log.json";
  link.click();

  setTimeout(() => URL.revokeObjectURL(link.href), 500);
};

function renderFilterButton(group, activeGroup) {
  const activeClass = group === activeGroup ? "active" : "";

  return `
    <button class="${activeClass}" data-group="${esc(group)}">
      ${esc(group)}
    </button>
  `;
}

function renderScamCard(item) {
  return `
    <button class="scam-card" data-title="${esc(item.t)}">
      <span class="tag">${esc(item.g)}</span>
      <h2>${esc(item.t)}</h2>
      <p>${esc(item.d)}</p>
    </button>
  `;
}

function renderScamDetail(item) {
  return `
    <p class="eyebrow">${esc(item.g)}</p>
    <h2>${esc(item.t)}</h2>
    <p>${esc(item.d)}</p>
    <h3>Dấu hiệu</h3>
    <p>${esc(item.sign)}</p>
    <h3>Cách xử lý</h3>
    <p>
      Dừng tương tác, tự tìm kênh chính thức để xác minh và báo cho người thân.
    </p>
  `;
}

function openScamDetail(title) {
  const item = scams.find((scam) => scam.t === title);
  if (!item) {
    return;
  }

  $("#scamContent").innerHTML = renderScamDetail(item);
  $("#scamDetail").showModal();
}

function renderLibrary(activeGroup) {
  const groups = ["Tất cả", ...new Set(scams.map((item) => item.g))];
  const visibleScams = scams.filter(
    (item) => activeGroup === "Tất cả" || item.g === activeGroup,
  );

  $("#filters").innerHTML = groups
    .map((group) => renderFilterButton(group, activeGroup))
    .join("");
  $("#scamGrid").innerHTML = visibleScams.map(renderScamCard).join("");

  $$("[data-group]").forEach((button) => {
    button.onclick = () => renderLibrary(button.dataset.group);
  });

  $$(".scam-card").forEach((button) => {
    button.onclick = () => openScamDetail(button.dataset.title);
  });
}

const scamDetail = $("#scamDetail");

$(".dialog-close").onclick = () => scamDetail.close();

scamDetail.addEventListener("click", (event) => {
  const bounds = scamDetail.getBoundingClientRect();
  const isOutside =
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom;

  if (isOutside) {
    scamDetail.close();
  }
});
