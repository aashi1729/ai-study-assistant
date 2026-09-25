import { extractText, getDocumentProxy } from "unpdf";
import { MAX_PDF_BYTES } from "./limits";

export class PdfExtractError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = "PdfExtractError";
    this.code = code;
    this.status = status;
  }
}

function hasPdfHeader(bytes) {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

export async function extractPdfTextFromFile(file) {
  if (!file || typeof file !== "object" || typeof file.arrayBuffer !== "function") {
    throw new PdfExtractError("MISSING_FILE", "Please choose a PDF file first.");
  }

  const fileName = typeof file.name === "string" && file.name.trim() ? file.name.trim() : "document.pdf";
  const type = typeof file.type === "string" ? file.type : "";
  const lowerName = fileName.toLowerCase();

  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractError("FILE_TOO_LARGE", "That PDF is too large. Please upload a file of 10 MB or less.");
  }

  if (file.size === 0) {
    throw new PdfExtractError("EMPTY_FILE", "That PDF is empty. Please choose another file.");
  }

  if ((type && type !== "application/pdf") || !lowerName.endsWith(".pdf")) {
    throw new PdfExtractError("NOT_A_PDF", "Please upload a PDF file. Other file types are not supported.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!hasPdfHeader(bytes)) {
    throw new PdfExtractError("NOT_A_PDF", "That file does not look like a valid PDF. Please try another file.");
  }

  let pageCount = 0;
  let text = "";

  try {
    const pdf = await getDocumentProxy(bytes);
    pageCount = pdf.numPages || 0;
    const extracted = await extractText(pdf, { mergePages: true });
    pageCount = extracted.totalPages || pageCount;
    text = typeof extracted.text === "string" ? extracted.text : Array.isArray(extracted.text) ? extracted.text.join("\n\n") : "";
  } catch {
    throw new PdfExtractError(
      "UNREADABLE_PDF",
      "I could not read that PDF. It may be damaged, password-protected, or not a real PDF.",
      422,
    );
  }

  const cleaned = text.replace(/\u0000/g, "").trim();

  if (!cleaned) {
    throw new PdfExtractError(
      "NO_TEXT",
      "I could not find extractable text in that PDF. It may be scanned images only.",
      422,
    );
  }

  return {
    success: true,
    fileName,
    pageCount,
    characterCount: cleaned.length,
    text: cleaned,
  };
}
