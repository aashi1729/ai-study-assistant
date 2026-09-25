import { ApiError, GoogleGenAI } from "@google/genai";

export const ALLOWED_FLASHCARD_COUNTS = [5, 10, 15];

const GEMINI_MODEL = "gemini-3.1-flash-lite";

function flashcardsJsonSchema(cardCount) {
  return {
    type: "object",
    properties: {
      flashcards: {
        type: "array",
        minItems: cardCount,
        maxItems: cardCount,
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["id", "question", "answer"],
        },
      },
    },
    required: ["flashcards"],
  };
}

export class FlashcardConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "FlashcardConfigError";
    this.code = "AI_NOT_CONFIGURED";
  }
}

export class FlashcardProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "FlashcardProviderError";
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

export function buildFlashcardsPrompt(notes, cardCount) {
  return [
    "You are a study assistant. Create flashcards for active recall from the student's notes.",
    `Generate exactly ${cardCount} flashcards.`,
    "Each flashcard must have a unique id, a question or concept on the front, and a clear answer or explanation on the back.",
    "Use only the supplied notes. Do not invent facts that are not in the notes.",
    "Avoid duplicate questions. Do not include markdown.",
    "Notes:",
    notes,
  ].join("\n\n");
}

function parseModelJson(content) {
  if (!content || typeof content !== "string") {
    throw new FlashcardProviderError("The AI provider returned an empty flashcard set.");
  }

  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new FlashcardProviderError("The AI provider returned a response that was not valid JSON.");
  }
}

function toFlashcards(parsed, cardCount) {
  if (!parsed || !Array.isArray(parsed.flashcards)) {
    throw new FlashcardProviderError("The AI provider returned an incomplete flashcard set.");
  }

  if (parsed.flashcards.length !== cardCount) {
    throw new FlashcardProviderError("The AI provider did not return the requested number of flashcards.");
  }

  const seenIds = new Set();
  const seenQuestions = new Set();

  return parsed.flashcards.map((item, index) => {
    const question = typeof item?.question === "string" ? item.question.trim() : "";
    const answer = typeof item?.answer === "string" ? item.answer.trim() : "";

    if (!question || !answer) {
      throw new FlashcardProviderError("The AI provider returned a flashcard that was not valid.");
    }

    const questionKey = question.toLowerCase();
    if (seenQuestions.has(questionKey)) {
      throw new FlashcardProviderError("The AI provider returned duplicate flashcards.");
    }
    seenQuestions.add(questionKey);

    let id = typeof item?.id === "string" && item.id.trim() ? item.id.trim() : String(index + 1);
    if (seenIds.has(id)) {
      id = String(index + 1);
    }
    seenIds.add(id);

    return { id, question, answer };
  });
}

async function requestFlashcardsFromModel({ notes, cardCount }) {
  const client = new GoogleGenAI({
    apiKey: getGeminiApiKey(),
  });

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildFlashcardsPrompt(notes, cardCount),
    config: {
      systemInstruction: "You write structured study flashcards for active recall. Reply with JSON only.",
      responseMimeType: "application/json",
      responseJsonSchema: flashcardsJsonSchema(cardCount),
    },
  });

  const parsed = parseModelJson(response.text);
  return toFlashcards(parsed, cardCount);
}

export async function generateFlashcards({ notes, cardCount }) {
  if (!getGeminiApiKey()) {
    throw new FlashcardConfigError(
      "The flashcard generator is not configured on the server yet. Set GEMINI_API_KEY in the server environment, then restart the app. Never add this key to client-side code."
    );
  }

  try {
    return await requestFlashcardsFromModel({ notes, cardCount });
  } catch (error) {
    if (error instanceof FlashcardConfigError || error instanceof FlashcardProviderError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new FlashcardProviderError(messageFromGeminiApiError(error));
    }

    throw new FlashcardProviderError("The flashcard generator could not complete this request.");
  }
}
