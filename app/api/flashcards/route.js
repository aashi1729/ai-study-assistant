import {
  ALLOWED_FLASHCARD_COUNTS,
  FlashcardConfigError,
  FlashcardProviderError,
  generateFlashcards,
} from "../../../lib/ai/generateFlashcards";

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
  const cardCount = Number(body?.cardCount);

  if (!notes) {
    return jsonError(
      400,
      "INVALID_NOTES",
      "Please paste some study notes first. I need text before I can generate flashcards."
    );
  }

  if (!ALLOWED_FLASHCARD_COUNTS.includes(cardCount)) {
    return jsonError(400, "INVALID_COUNT", "Choose 5, 10, or 15 cards.");
  }

  try {
    const flashcards = await generateFlashcards({ notes, cardCount });
    return Response.json({ flashcards });
  } catch (error) {
    if (error instanceof FlashcardConfigError) {
      return jsonError(503, error.code, error.message);
    }

    if (error instanceof FlashcardProviderError) {
      return jsonError(502, error.code, error.message);
    }

    return jsonError(500, "FLASHCARDS_FAILED", "The flashcard generator could not complete this request.");
  }
}
