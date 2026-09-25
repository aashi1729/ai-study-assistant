import { extractPdfTextFromFile, PdfExtractError } from "../../../lib/pdf/extractPdfText";

export const runtime = "nodejs";

function jsonError(status, error, message) {
  return Response.json({ success: false, error, message }, { status });
}

export async function POST(request) {
  let formData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "INVALID_FORM", "Please upload the PDF as form data.");
  }

  const file = formData.get("file");

  try {
    const result = await extractPdfTextFromFile(file);
    return Response.json(result);
  } catch (error) {
    if (error instanceof PdfExtractError) {
      return jsonError(error.status, error.code, error.message);
    }

    return jsonError(500, "EXTRACT_FAILED", "The PDF could not be processed. Please try again.");
  }
}
