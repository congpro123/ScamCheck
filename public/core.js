"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const KEYS = {
  history: "scamcheck_history",
  cache: "scamcheck_cache_context_v3",
  logs: "scamcheck_logs",
  prefs: "scamcheck_prefs",
  training: "scamcheck_training_v1",
};
const LIMIT = 6;
const HTML_ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function esc(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) => HTML_ENTITIES[character],
  );
}

function hash(value) {
  let result = 2166136261;

  for (const character of value.trim().toLowerCase()) {
    result = (result ^ character.charCodeAt(0)) * 16777619;
  }

  return (result >>> 0).toString(36);
}
