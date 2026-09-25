"use client";

import { useMemo, useRef, useState } from "react";
import AppShell from "./AppShell";
import PdfAskPanel from "./PdfAskPanel";
import PdfStudyPanel from "./PdfStudyPanel";
import { currentUser } from "../data/sampleData";
import { MAX_PDF_BYTES, MAX_PDF_LABEL } from "../lib/pdf/limits";

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function PdfUploadView() {
  const [searchValue, setSearchValue] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);
  const extractRequest = useRef(null);

  const fileLabel = useMemo(() => {
    if (!file) {
      return "No file selected";
    }

    return `${file.name} · ${formatFileSize(file.size)}`;
  }, [file]);

  function resetSelection() {
    if (extractRequest.current) {
      extractRequest.current.abort();
    }
    setFile(null);
    setError("");
    setResult(null);
    setLoading(false);
    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      return;
    }

    const isPdf = nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setFile(null);
      setError("Please choose a PDF file. Other file types are not supported.");
      event.target.value = "";
      return;
    }

    if (nextFile.size > MAX_PDF_BYTES) {
      setFile(null);
      setError(`That PDF is too large. Please choose a file of ${MAX_PDF_LABEL} or less.`);
      event.target.value = "";
      return;
    }

    if (nextFile.size === 0) {
      setFile(null);
      setError("That PDF is empty. Please choose another file.");
      event.target.value = "";
      return;
    }

    setError("");
    setFile(nextFile);
  }

  async function handleExtract(event) {
    event.preventDefault();

    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setError("");
    setLoading(true);

    if (extractRequest.current) {
      extractRequest.current.abort();
    }

    const controller = new AbortController();
    extractRequest.current = controller;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message || "Something went wrong while extracting text from the PDF.");
        return;
      }

      setResult(data);
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        return;
      }

      setError("Could not reach the PDF extractor. Check that the app is running and try again.");
    } finally {
      if (extractRequest.current === controller) {
        setLoading(false);
      }
    }
  }

  return (
    <AppShell user={currentUser} searchValue={searchValue} onSearchChange={setSearchValue}>
      <div className="mb-6">
        <a href="/" className="w-fit text-sm font-semibold text-indigo-700 transition hover:text-indigo-800">
          ← Back to Dashboard
        </a>
      </div>

      <section className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Upload Study PDF</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Upload your lecture notes or study material and extract the text for AI-powered studying.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <form onSubmit={handleExtract} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <label htmlFor="pdf-file" className="text-sm font-semibold text-slate-900">
            PDF file
          </label>

          <label
            htmlFor="pdf-file"
            className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <span className="text-sm font-semibold text-slate-800">Click to select a PDF</span>
            <span className="mt-1 text-xs text-slate-500">PDF only · up to {MAX_PDF_LABEL}</span>
            <span className="mt-3 text-sm font-medium text-indigo-700">{fileLabel}</span>
          </label>
          <input
            ref={fileInput}
            id="pdf-file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="sr-only"
          />

          {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Start Over
            </button>
            <button
              type="button"
              onClick={resetSelection}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Upload another PDF
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {loading ? "Extracting text..." : "Extract Text"}
            </button>
          </div>
        </form>

        <div className="min-w-0">
          {loading ? (
            <div className="mb-4 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6">
              <p className="text-sm font-semibold text-indigo-800">Extracting text...</p>
              <p className="mt-2 text-sm leading-6 text-indigo-700">
                The PDF is being processed on the server. Gemini is not used in this step.
              </p>
            </div>
          ) : null}
          {result ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">PDF preview</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Text extracted successfully</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filename</dt>
                  <dd className="mt-1 break-all text-sm font-medium text-slate-900">{result.fileName}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pages</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{result.pageCount}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Characters</dt>
                  <dd className="mt-1 text-sm font-medium text-slate-900">{result.characterCount}</dd>
                </div>
              </dl>
              <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.text}</p>
              </div>
            </section>
          ) : !loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
              Extracted text will appear here after you upload a PDF and click Extract Text.
            </div>
          ) : null}
        </div>
      </div>

      <PdfAskPanel
        key={result?.text ? `${result.fileName}-${result.characterCount}` : "pdf-ask-empty"}
        extractedText={result?.text || ""}
      />

      {result?.text ? (
        <PdfStudyPanel key={`${result.fileName}-${result.characterCount}`} extractedText={result.text} />
      ) : null}
    </AppShell>
  );
}
