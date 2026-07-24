"use strict";

require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const {
  analyzeWithRules,
  mergeAnalysis,
  sanitizeInput,
} = require("./src/analysis");
const { DEFAULT_TIMEOUT, createGenerator, retry } = require("./src/gemini");
const {
  filterApprovedPhones,
  parseDetective,
  parsePsychologist,
  parseResponder,
  responseContacts,
} = require("./src/parsers");
const {
  buildDetectivePrompt,
  buildPsychologistPrompt,
  buildResponderPrompt,
} = require("./src/prompts");
const { detectiveSchema } = require("./src/schemas");
const hotlines = require("./data/hotlines.json");

const PORT = Number(process.env.PORT || 3000);
const MAX_INPUT_LENGTH = 6000;
const AI_TIMEOUT = DEFAULT_TIMEOUT;
const ANALYSIS_FLOW_TIMEOUT = 19500;

function resolveModelName(requestedModel) {
  const unsupportedModel = /^(?:gemini-2\.0|gemini-3\.5-flash)(?:-|$)/;
  return unsupportedModel.test(requestedModel)
    ? "gemini-3.1-flash-lite"
    : requestedModel;
}

const modelName = resolveModelName(
  process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
);
const legalGuidance = fs
  .readFileSync(path.join(__dirname, "data", "legal-guidance.txt"), "utf8")
  .trim();
const generate = createGenerator({
  apiKey: process.env.GEMINI_API_KEY,
  modelName,
  timeout: AI_TIMEOUT,
});

function fallbackMessage(error) {
  if (error.code === "NO_API_KEY") {
    return "Chưa cấu hình khoá Gemini; đang dùng lớp luật an toàn.";
  }

  if (error.code === "TIMEOUT") {
    return "AI phản hồi quá lâu; đang dùng lớp luật an toàn.";
  }

  return "Không thể kết nối AI; đang dùng lớp luật an toàn.";
}

function remainingAnalysisTime(startedAt) {
  return ANALYSIS_FLOW_TIMEOUT - (Date.now() - startedAt);
}

async function analyzePsychology(message, detective, flowStartedAt) {
  if (detective.risk === "An toàn") {
    return {
      psychology: null,
      psychologyError: null,
    };
  }

  try {
    const remainingMilliseconds = remainingAnalysisTime(flowStartedAt);

    if (remainingMilliseconds < 500) {
      throw Object.assign(new Error("TIMEOUT"), { code: "TIMEOUT" });
    }

    const response = await generate(
      buildPsychologistPrompt({
        text: message,
        risk: detective.risk,
      }),
      undefined,
      Math.min(AI_TIMEOUT, remainingMilliseconds),
    );

    return {
      psychology: parsePsychologist(response),
      psychologyError: null,
    };
  } catch {
    return {
      psychology: null,
      psychologyError: "Cô tâm lý đang bận, nhưng kết quả Thám tử vẫn đầy đủ.",
    };
  }
}

async function analyzeMessage(request, response) {
  const input = sanitizeInput(request.body?.text, MAX_INPUT_LENGTH);

  if (!input.ok) {
    return response.status(400).json({ error: input.error });
  }

  const localAnalysis = analyzeWithRules(input.value);
  const flowStartedAt = Date.now();

  try {
    const rawAnalysis = await generate(
      buildDetectivePrompt({
        text: input.value,
        legalGuidance,
      }),
      detectiveSchema,
    );
    const detective = mergeAnalysis(parseDetective(rawAnalysis), localAnalysis);
    const psychologyResult = await analyzePsychology(
      input.value,
      detective,
      flowStartedAt,
    );

    return response.json({
      detective,
      ...psychologyResult,
      local: localAnalysis,
      meta: {
        model: modelName,
        ai: true,
      },
    });
  } catch (error) {
    return response.json({
      detective: mergeAnalysis(null, localAnalysis),
      psychology: null,
      psychologyError: fallbackMessage(error),
      local: localAnalysis,
      meta: {
        ai: false,
      },
    });
  }
}

function approvedContactList() {
  return hotlines
    .map((contact) => `${contact.name}: ${contact.phone}`)
    .join("; ");
}

async function createResponsePlan(request, response) {
  const scenario = String(request.body?.scenario || "none");
  const input = sanitizeInput(request.body?.text, MAX_INPUT_LENGTH);

  if (!input.ok) {
    return response.status(400).json({ error: input.error });
  }

  try {
    const rawPlan = await generate(
      buildResponderPrompt({
        text: input.value,
        scenario,
        approvedContacts: approvedContactList(),
      }),
    );
    const plan = parseResponder(rawPlan, scenario, hotlines);

    return response.json({
      ...filterApprovedPhones(plan, hotlines),
      contacts: responseContacts(scenario, input.value, hotlines),
    });
  } catch {
    return response.json({
      ...parseResponder(null, scenario, hotlines),
      contacts: responseContacts(scenario, input.value, hotlines),
    });
  }
}

async function createQrCode(request, response) {
  const publicUrl =
    process.env.PUBLIC_URL || `${request.protocol}://${request.get("host")}`;

  try {
    const image = await QRCode.toBuffer(publicUrl, {
      type: "png",
      width: 300,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return response
      .type("png")
      .set("Cache-Control", "public, max-age=3600")
      .send(image);
  } catch {
    return response.status(500).json({
      error: "Không tạo được mã QR.",
    });
  }
}

function healthStatus(_request, response) {
  return response.json({
    ok: true,
    model: modelName,
    configured: Boolean(process.env.GEMINI_API_KEY),
  });
}

function unknownApiRoute(_request, response) {
  return response.status(404).json({
    error: "Không tìm thấy chức năng.",
  });
}

function renderApplication(_request, response) {
  return response.sendFile(path.join(__dirname, "public", "index.html"));
}

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(
  express.static(path.join(__dirname, "public"), {
    extensions: ["html"],
  }),
);
app.post("/api/analyze", analyzeMessage);
app.post("/api/respond", createResponsePlan);
app.get("/api/hotlines", (_request, response) => response.json(hotlines));
app.get("/api/qr", createQrCode);
app.get("/api/health", healthStatus);
app.use("/api", unknownApiRoute);
app.get("*", renderApplication);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ScamCheck: http://localhost:${PORT}`);
  });
}

module.exports = {
  app,
  retry,
};
