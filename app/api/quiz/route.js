import {
  ALLOWED_DIFFICULTIES,
  ALLOWED_QUESTION_COUNTS,
  QuizConfigError,
  QuizProviderError,
  generateQuiz,
} from "../../../lib/ai/generateQuiz";

function jsonError(status, error, message) {
  return Response.json({ error, message }, { status });
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }

  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const questionCount = Number(body?.questionCount);
  const difficulty = body?.difficulty;

  if (!notes) {
    return jsonError(
      400,
      "INVALID_NOTES",
      "Please paste some study notes first. I need text before I can generate a quiz."
    );
  }

  if (!ALLOWED_QUESTION_COUNTS.includes(questionCount)) {
    return jsonError(400, "INVALID_COUNT", "Choose 5, 10, or 15 questions.");
  }

  if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
    return jsonError(400, "INVALID_DIFFICULTY", "Choose a difficulty of Easy, Medium, or Hard.");
  }

  try {
    const questions = await generateQuiz({ notes, questionCount, difficulty });
    return Response.json({ questions });
  } catch (error) {
    if (error instanceof QuizConfigError) {
      return jsonError(503, error.code, error.message);
    }

    if (error instanceof QuizProviderError) {
      return jsonError(502, error.code, error.message);
    }

    return jsonError(500, "QUIZ_FAILED", "The quiz generator could not complete this request.");
  }
}
