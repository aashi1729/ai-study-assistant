import { ApiError, GoogleGenAI } from "@google/genai";

export const ALLOWED_SUMMARY_LENGTHS = ["short", "medium", "detailed"];

const GEMINI_MODEL = "gemini-3.1-flash-lite";

const LENGTH_GUIDE = {
  short: "Write a brief recap: about 2 sentences, 3 key points, and 3 important concepts.",
  medium: "Write an exam-ready recap: about 3 sentences, 5 key points, and 5 important concepts.",
  detailed: "Write a thorough recap: about 5 sentences, 7 key points, and 7 important concepts.",
};

const LENGTH_HEADING = {
  short: "Short summary of your notes",
  medium: "Medium summary of your notes",
  detailed: "Detailed summary of your notes",
};

const SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keyPoints: {
      type: "array",
      items: { type: "string" },
    },
    concepts: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["summary", "keyPoints", "concepts"],
};

export class SummarizeConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "SummarizeConfigError";
    this.code = "AI_NOT_CONFIGURED";
  }
}

export class SummarizeProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "SummarizeProviderError";
    this.code = "AI_PROVIDER_ERROR";
  }
}

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || "";
}

function messageFromGeminiApiError(error) {
  const status = error.status ?? null;

  if (status === 503) {
    return "Gemini is temporarily unavailable because this model is experiencing high demand. Try again in a moment.";
  }

  if (status === 429) {
    return "Gemini could not complete this request because the free-tier quota or rate limit was reached. Try again later.";
  }

  if (status === 401 || status === 403) {
    return "Gemini rejected the server credentials. Check GEMINI_API_KEY in the server environment.";
  }

  return "The Gemini request failed. Check the server configuration and try again.";
}

export function buildSummarizePrompt(notes, summaryLength) {
  return [
    "You are a study assistant. Summarize the student's notes for exam revision.",
    LENGTH_GUIDE[summaryLength],
    'Return a JSON object with exactly these keys: "summary" (string), "keyPoints" (array of strings), "concepts" (array of strings).',
    "Do not include markdown. Use only the notes as the source.",
    "Notes:",
    notes,
  ].join("\n\n");
}

function parseModelJson(content) {
  if (!content || typeof content !== "string") {
    throw new SummarizeProviderError("The AI provider returned an empty summary.");
  }

  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new SummarizeProviderError("The AI provider returned a response that was not valid JSON.");
  }
}

function toSummaryResult(parsed, summaryLength) {
  const overview = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
  const keyPoints = Array.isArray(parsed.keyPoints)
    ? parsed.keyPoints.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];
  const concepts = Array.isArray(parsed.concepts)
    ? parsed.concepts.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];

  if (!overview || keyPoints.length === 0 || concepts.length === 0) {
    throw new SummarizeProviderError("The AI provider returned an incomplete summary.");
  }

  return {
    heading: LENGTH_HEADING[summaryLength] || "Summary of your notes",
    overview,
    keyPoints,
    concepts,
  };
}

async function requestSummaryFromModel({ notes, summaryLength }) {
  const client = new GoogleGenAI({
    apiKey: getGeminiApiKey(),
  });

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildSummarizePrompt(notes, summaryLength),
    config: {
      systemInstruction: "You write structured study summaries. Reply with JSON only.",
      responseMimeType: "application/json",
      responseJsonSchema: SUMMARY_JSON_SCHEMA,
    },
  });

  const parsed = parseModelJson(response.text);
  return toSummaryResult(parsed, summaryLength);
}

export async function summarizeWithAI({ notes, summaryLength }) {
  if (!getGeminiApiKey()) {
    throw new SummarizeConfigError(
      "The summarizer is not configured on the server yet. Set GEMINI_API_KEY in the server environment, then restart the app. Never add this key to client-side code."
    );
  }

  try {
    return await requestSummaryFromModel({ notes, summaryLength });
  } catch (error) {
    if (error instanceof SummarizeConfigError || error instanceof SummarizeProviderError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new SummarizeProviderError(messageFromGeminiApiError(error));
    }

    throw new SummarizeProviderError("The summarizer could not complete this request.");
  }
}

export const MAX_PDF_ASK_QUESTION = 2000;
export const MAX_PDF_ASK_TEXT = 80000;

export function buildPdfAskPrompt(pdfText, question) {
  return [
    "You are a study assistant. Answer the user's question using ONLY the provided PDF content. If the answer cannot be found or reasonably inferred from the PDF, say that the information is not available in the provided PDF.",
    "PDF content:",
    pdfText,
    "User question:",
    question,
  ].join("\n\n");
}

async function requestPdfAnswerFromModel({ question, pdfText }) {
  const client = new GoogleGenAI({
    apiKey: getGeminiApiKey(),
  });

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPdfAskPrompt(pdfText, question),
    config: {
      systemInstruction:
        "You are a study assistant. Answer the user's question using ONLY the provided PDF content. If the answer cannot be found or reasonably inferred from the PDF, say that the information is not available in the provided PDF.",
    },
  });

  const answer = typeof response.text === "string" ? response.text.trim() : "";

  if (!answer) {
    throw new SummarizeProviderError("The AI provider returned an empty answer.");
  }

  return answer;
}

export async function askAboutPdfWithAI({ question, pdfText }) {
  if (!getGeminiApiKey()) {
    throw new SummarizeConfigError(
      "The PDF assistant is not configured on the server yet. Set GEMINI_API_KEY in the server environment, then restart the app. Never add this key to client-side code."
    );
  }

  try {
    return await requestPdfAnswerFromModel({ question, pdfText });
  } catch (error) {
    if (error instanceof SummarizeConfigError || error instanceof SummarizeProviderError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new SummarizeProviderError(messageFromGeminiApiError(error));
    }

    throw new SummarizeProviderError("The PDF assistant could not complete this request.");
  }
}
