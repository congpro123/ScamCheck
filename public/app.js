"use strict";

function updateSpeechButton(button, isListening) {
  button.textContent = isListening ? "Dừng ghi âm" : "Đọc bằng giọng nói";
  button.setAttribute("aria-pressed", String(isListening));
}

function initializeSpeechRecognition() {
  const speechButton = $("#speak");
  const messageInput = $("#message");
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speechButton.onclick = () => {
      friendlyError(
        "Trình duyệt này chưa hỗ trợ nhập giọng nói. Bác có thể dùng nút micro trên bàn phím.",
      );
    };
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "vi-VN";
  recognition.continuous = true;

  recognition.onresult = (event) => {
    messageInput.value = [...event.results]
      .map((result) => result[0].transcript)
      .join(" ");
    messageInput.dispatchEvent(new Event("input"));
  };

  recognition.onend = () => {
    updateSpeechButton(speechButton, false);
  };

  speechButton.onclick = () => {
    const isListening = speechButton.getAttribute("aria-pressed") === "true";

    if (isListening) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
      updateSpeechButton(speechButton, true);
    } catch {}
  };
}

function alignLatestResult() {
  const verdict = $("#result .risk");

  if (!verdict) {
    return;
  }

  const headerHeight = $("header").getBoundingClientRect().height;
  const resultTop =
    scrollY + verdict.getBoundingClientRect().top - headerHeight - 32;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  scrollTo({
    top: scrollY,
    behavior: "auto",
  });
  requestAnimationFrame(() => {
    scrollTo({
      top: Math.max(0, resultTop),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  });
}

function initializeResultAlignment() {
  const resultContainer = $("#result");
  const observer = new MutationObserver(() => {
    setTimeout(alignLatestResult, 0);
  });

  observer.observe(resultContainer, {
    childList: true,
  });
}

function initializeApplication() {
  initializeSpeechRecognition();
  initializeResultAlignment();
  renderLibrary("Tất cả");
  renderQuiz();
  showView(viewFromPath());
}

initializeApplication();
