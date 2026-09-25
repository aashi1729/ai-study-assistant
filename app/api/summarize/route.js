import {
  ALLOWED_SUMMARY_LENGTHS,
  SummarizeConfigError,
  SummarizeProviderError,
  summarizeWithAI,
} from "../../../lib/ai/summarizeWithAI";

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
  const summaryLength = body?.summaryLength;

  if (!notes) {
    return jsonError(
      400,
      "INVALID_NOTES",
      "Please paste some study notes first. I need text before I can summarize."
    );
  }

  if (!ALLOWED_SUMMARY_LENGTHS.includes(summaryLength)) {
    return jsonError(
      400,
      "INVALID_LENGTH",
      "Choose a summary length of short, medium, or detailed."
    );
  }

  try {
    const summary = await summarizeWithAI({ notes, summaryLength });
    return Response.json({ summary });
  } catch (error) {
    if (error instanceof SummarizeConfigError) {
      return jsonError(503, error.code, error.message);
    }

    if (error instanceof SummarizeProviderError) {
      return jsonError(502, error.code, error.message);
    }

    return jsonError(500, "SUMMARIZE_FAILED", "The summarizer could not complete this request.");
  }
}
