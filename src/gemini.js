"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_TIMEOUT = 18000;

function timeoutPromise(milliseconds) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = Object.assign(new Error("TIMEOUT"), { code: "TIMEOUT" });
      reject(error);
    }, milliseconds);
  });
}

async function retry(
  operation,
  attempts = 3,
  wait = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
) {
  let lastError;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRateLimited =
        error?.status === 429 || /429|quota|rate/i.test(error?.message ?? "");

      if (!isRateLimited || attempt === attempts - 1) {
        throw error;
      }

      await wait(500 * 2 ** attempt);
    }
  }

  throw lastError;
}

function createGenerator({ apiKey, modelName, timeout = DEFAULT_TIMEOUT }) {
  const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  return async function generate(prompt, schema, timeoutMs = timeout) {
    if (!client) {
      throw Object.assign(new Error("NO_API_KEY"), { code: "NO_API_KEY" });
    }

    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
        ...(schema ? { responseSchema: schema } : {}),
      },
    });

    const result = await Promise.race([
      retry(() => model.generateContent(prompt)),
      timeoutPromise(timeoutMs),
    ]);

    return result.response.text();
  };
}

module.exports = {
  DEFAULT_TIMEOUT,
  createGenerator,
  retry,
};
