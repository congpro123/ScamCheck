"use strict";

const { SchemaType } = require("@google/generative-ai");

const detectiveSchema = {
  type: SchemaType.OBJECT,
  properties: {
    risk: {
      type: SchemaType.STRING,
      enum: ["An toàn", "Nghi ngờ", "Nguy hiểm"],
    },
    signals: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          reason: { type: SchemaType.STRING },
          quote: { type: SchemaType.STRING },
        },
        required: ["reason", "quote"],
      },
    },
    actions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["risk", "signals", "actions"],
};

module.exports = { detectiveSchema };
