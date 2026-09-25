import {
  MAX_PDF_ASK_QUESTION,
  MAX_PDF_ASK_TEXT,
  SummarizeConfigError,
  SummarizeProviderError,
  askAboutPdfWithAI,
} from "../../../../lib/ai/summarizeWithAI";

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

  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const pdfText = typeof body?.pdfText === "string" ? body.pdfText.trim() : "";

  if (!question) {
    return jsonError(400, "INVALID_QUESTION", "Please enter a question about this PDF first.");
  }

  if (question.length > MAX_PDF_ASK_QUESTION) {
    return jsonError(400, "QUESTION_TOO_LONG", "That question is too long. Please shorten it and try again.");
  }

  if (!pdfText) {
    return jsonError(400, "INVALID_PDF_TEXT", "Upload and extract a PDF before asking a question.");
  }

  if (pdfText.length > MAX_PDF_ASK_TEXT) {
    return jsonError(
      400,
      "PDF_TEXT_TOO_LONG",
      "That extracted PDF is too large to send in one question. Try a shorter document.",
    );
  }

  try {
    const answer = await askAboutPdfWithAI({ question, pdfText });
    return Response.json({ answer });
  } catch (error) {
    if (error instanceof SummarizeConfigError) {
      return jsonError(503, error.code, error.message);
    }

    if (error instanceof SummarizeProviderError) {
      return jsonError(502, error.code, error.message);
    }

    return jsonError(500, "PDF_ASK_FAILED", "The PDF assistant could not complete this request.");
  }
}
