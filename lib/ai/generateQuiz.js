import { ApiError, GoogleGenAI } from "@google/genai";

export const ALLOWED_QUESTION_COUNTS = [5, 10, 15];
export const ALLOWED_DIFFICULTIES = ["Easy", "Medium", "Hard"];

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const OPTION_IDS = ["a", "b", "c", "d"];

const DIFFICULTY_GUIDE = {
  Easy: "Write straightforward recall questions with one clearly correct answer.",
  Medium: "Write exam-style questions that need a little understanding, not only memorization.",
  Hard: "Write challenging questions that test careful reading of the notes.",
};

function quizJsonSchema(questionCount) {
  return {
    type: "object",
    properties: {
      questions: {
        type: "array",
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            question: { type: "string" },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                },
                required: ["id", "text"],
              },
            },
            correctOptionId: { type: "string" },
          },
          required: ["id", "question", "options", "correctOptionId"],
        },
      },
    },
    required: ["questions"],
  };
}

export class QuizConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "QuizConfigError";
    this.code = "AI_NOT_CONFIGURED";
  }
}

export class QuizProviderError extends Error {
  constructor(message) {
    super(message);
    this.name = "QuizProviderError";
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

export function buildQuizPrompt(notes, questionCount, difficulty) {
  return [
    "You are a study assistant. Create a multiple-choice quiz from the student's notes.",
    `Generate exactly ${questionCount} questions.`,
    `Difficulty: ${difficulty}. ${DIFFICULTY_GUIDE[difficulty]}`,
    "Use only the supplied notes. Do not invent facts that are not in the notes.",
    "Each question must have exactly 4 options with ids a, b, c, and d.",
    "Set correctOptionId to the id of the one correct option.",
    "Do not include explanations, hints, or markdown.",
    "Notes:",
    notes,
  ].join("\n\n");
}

function parseModelJson(content) {
  if (!content || typeof content !== "string") {
    throw new QuizProviderError("The AI provider returned an empty quiz.");
  }

  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    throw new QuizProviderError("The AI provider returned a response that was not valid JSON.");
  }
}

function normalizeOptionId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function toQuizQuestions(parsed, questionCount) {
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new QuizProviderError("The AI provider returned an incomplete quiz.");
  }

  if (parsed.questions.length !== questionCount) {
    throw new QuizProviderError("The AI provider did not return the requested number of questions.");
  }

  const seenIds = new Set();

  return parsed.questions.map((item, index) => {
    const questionText = typeof item?.question === "string" ? item.question.trim() : "";
    const rawOptions = Array.isArray(item?.options) ? item.options : [];

    if (!questionText || rawOptions.length !== 4) {
      throw new QuizProviderError("The AI provider returned a question that was not valid.");
    }

    const originalIds = rawOptions.map((option) => normalizeOptionId(option?.id));
    const options = rawOptions.map((option, optionIndex) => {
      const text = typeof option?.text === "string" ? option.text.trim() : "";

      if (!text) {
        throw new QuizProviderError("The AI provider returned a question that was not valid.");
      }

      return {
        id: OPTION_IDS[optionIndex],
        text,
      };
    });

    const rawCorrect = normalizeOptionId(item?.correctOptionId);
    let correctIndex = originalIds.indexOf(rawCorrect);

    if (correctIndex < 0) {
      correctIndex = OPTION_IDS.indexOf(rawCorrect);
    }

    const correctOptionId = OPTION_IDS[correctIndex];

    if (!correctOptionId) {
      throw new QuizProviderError("The AI provider returned a question that was not valid.");
    }

    let id = typeof item?.id === "string" && item.id.trim() ? item.id.trim() : `q${index + 1}`;
    if (seenIds.has(id)) {
      id = `q${index + 1}`;
    }
    seenIds.add(id);

    return {
      id,
      question: questionText,
      options,
      correctOptionId,
    };
  });
}

async function requestQuizFromModel({ notes, questionCount, difficulty }) {
  const client = new GoogleGenAI({
    apiKey: getGeminiApiKey(),
  });

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildQuizPrompt(notes, questionCount, difficulty),
    config: {
      systemInstruction: "You write structured multiple-choice quizzes. Reply with JSON only. Do not include explanations.",
      responseMimeType: "application/json",
      responseJsonSchema: quizJsonSchema(questionCount),
    },
  });

  const parsed = parseModelJson(response.text);
  return toQuizQuestions(parsed, questionCount);
}

export async function generateQuiz({ notes, questionCount, difficulty }) {
  if (!getGeminiApiKey()) {
    throw new QuizConfigError(
      "The quiz generator is not configured on the server yet. Set GEMINI_API_KEY in the server environment, then restart the app. Never add this key to client-side code."
    );
  }

  try {
    return await requestQuizFromModel({ notes, questionCount, difficulty });
  } catch (error) {
    if (error instanceof QuizConfigError || error instanceof QuizProviderError) {
      throw error;
    }

    if (error instanceof ApiError) {
      throw new QuizProviderError(messageFromGeminiApiError(error));
    }

    throw new QuizProviderError("The quiz generator could not complete this request.");
  }
}
