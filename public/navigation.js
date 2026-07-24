"use strict";

const viewPaths = {
  home: "/",
  library: "/library",
  training: "/training",
  simulation: "/simulation",
  history: "/history",
};
const pathViews = Object.fromEntries(
  Object.entries(viewPaths).map(([view, path]) => [path, view]),
);
function viewFromPath() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  return pathViews[path] || "home";
}
function showView(id, { updateUrl = false } = {}) {
  if (!viewPaths[id]) {
    id = "home";
  }

  $$(".view").forEach((view) => {
    view.classList.toggle("active", view.id === id);
  });

  $$("nav [data-view]").forEach((button) => {
    const isActive = button.dataset.view === id;

    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (id === "history") {
    renderHistory();
  }

  if (id === "library") {
    renderLibrary("Tất cả");
  }

  if (id === "training" && !$("#quiz").hasChildNodes()) {
    renderQuiz();
  }

  if (id === "simulation" && !$("#simulationStage").hasChildNodes()) {
    renderSimulationChooser();
  }

  if (updateUrl && location.pathname !== viewPaths[id]) {
    history.pushState({ view: id }, "", viewPaths[id]);
  }

  scrollTo(0, 0);
}

function clearPreviousResult() {
  state.analysis = null;
  state.text = "";
  $("#result").replaceChildren();
  $("#result").hidden = true;
  friendlyError("");
}
function closeMenu() {
  $("header").classList.remove("menu-open");
  $("#menuToggle").innerHTML = '<span aria-hidden="true">☰</span>';
  $("#menuToggle").setAttribute("aria-expanded", "false");
  $("#menuToggle").setAttribute("aria-label", "Mở mục lục");
}
function navigateToView(id, { clearResult = false } = {}) {
  if (clearResult && id === "home") {
    clearPreviousResult();
  }

  showView(id, { updateUrl: true });
  closeMenu();
}

$$("[data-view]").forEach((button) => {
  button.onclick = () => {
    navigateToView(button.dataset.view, {
      clearResult: button.dataset.view === "home",
    });
  };
});

addEventListener("popstate", () => showView(viewFromPath()));

$("#menuToggle").onclick = () => {
  const open = $("header").classList.toggle("menu-open");
  $("#menuToggle").innerHTML = `
    <span aria-hidden="true">${open ? "×" : "☰"}</span>
  `;
  $("#menuToggle").setAttribute("aria-expanded", String(open));
  $("#menuToggle").setAttribute(
    "aria-label",
    open ? "Đóng mục lục" : "Mở mục lục",
  );
};

const prefs = load(KEYS.prefs, {});
const requestedTheme = new URLSearchParams(location.search).get("theme");

document.body.classList.toggle("light-theme", requestedTheme === "light");
document.body.classList.toggle("high-contrast", !!prefs.contrast);
document.documentElement.classList.toggle("large-text", !!prefs.large);

function syncDisplayControls() {
  const light = document.body.classList.contains("light-theme");
  const contrast = document.body.classList.contains("high-contrast");
  const large = document.documentElement.classList.contains("large-text");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  $("#themeToggle").setAttribute("aria-pressed", String(light));
  $("#themeToggle").setAttribute(
    "aria-label",
    light ? "Dùng giao diện tối" : "Dùng giao diện sáng",
  );
  $("#themeToggle").setAttribute(
    "title",
    light ? "Dùng giao diện tối" : "Dùng giao diện sáng",
  );
  $("#themeToggle").innerHTML = `
    <span aria-hidden="true">${light ? "☾" : "☼"}</span>
  `;
  $("#contrastToggle").setAttribute("aria-pressed", String(contrast));
  $("#contrastToggle").setAttribute(
    "aria-label",
    contrast ? "Tắt tương phản cao" : "Bật tương phản cao",
  );
  $("#contrastToggle").setAttribute(
    "title",
    contrast ? "Tắt tương phản cao" : "Bật tương phản cao",
  );
  $("#fontSize").setAttribute("aria-pressed", String(large));
  $("#fontSize").setAttribute(
    "aria-label",
    large ? "Thu nhỏ chữ" : "Phóng to chữ",
  );
  $("#fontSize").setAttribute("title", large ? "Thu nhỏ chữ" : "Phóng to chữ");
  $("#fontSize").textContent = large ? "A−" : "A+";
  document.documentElement.style.colorScheme = contrast
    ? "dark"
    : light
      ? "light"
      : "dark";

  if (themeColor) {
    themeColor.content = contrast ? "#000000" : light ? "#f7f8ff" : "#070b1d";
  }
}

$("#themeToggle").onclick = () => {
  document.body.classList.toggle("light-theme");
  syncDisplayControls();
};
$("#contrastToggle").onclick = () => {
  document.body.classList.toggle("high-contrast");
  save(KEYS.prefs, {
    ...load(KEYS.prefs, {}),
    contrast: document.body.classList.contains("high-contrast"),
  });
  syncDisplayControls();
};
$("#fontSize").onclick = () => {
  document.documentElement.classList.toggle("large-text");
  save(KEYS.prefs, {
    ...load(KEYS.prefs, {}),
    large: document.documentElement.classList.contains("large-text"),
  });
  syncDisplayControls();
};

syncDisplayControls();
