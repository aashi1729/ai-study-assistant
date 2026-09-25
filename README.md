# 🤖 AI Study Assistant

An AI-powered study platform built with **Next.js** and **Google Gemini**. Paste notes or upload a PDF to generate summaries, quizzes, and flashcards, then track progress with a study timer, history, and analytics.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-@google/genai-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📌 Overview

Students often sit with long lecture notes or PDFs and little time to turn them into something they can actually review. **AI Study Assistant** takes pasted notes or extracted PDF text, sends that content to **server-side API routes**, and uses **Google Gemini** to produce structured study material.

You can summarize notes (short, medium, or detailed), generate scored multiple-choice quizzes, practice flashcards, ask questions about an uploaded PDF, run a focus timer, and see streaks, weekly activity, and quiz/focus stats from sessions saved in the browser.

The header profile is **Aashi Tyagi** (Computer Science).

---

## ✨ Features

- **AI note summarization** — short, medium, or detailed summaries with key points and concepts
- **AI quiz generation** — 5, 10, or 15 questions; Easy, Medium, or Hard
- **Quiz scoring** — score vs. total after submit
- **AI flashcards** — 5, 10, or 15 cards; mark **I Know This** or **Need to Review**
- **PDF upload & text extraction** — PDF files up to **10 MB**, processed on the server with `unpdf` (the file is not sent to Gemini)
- **Study from a PDF** — generate a summary, quiz, or flashcards from extracted text
- **Ask AI about this PDF** — questions answered using only the extracted PDF text; session Q&A stays in memory on the page
- **Study History** — saved summaries, quizzes, flashcards, and completed focus/deep-study timers; search, filter, delete, and clear
- **Dashboard** — live stats from history, study streak, last-7-day activity, recent sessions
- **Study Timer** — Focus (25 min), Deep Study (50 min), Short Break (5 min); completed Focus/Deep Study sessions are saved
- **Progress & Analytics** — total sessions, quiz average/high/low, focus minutes, current and longest streak, activity by type, earned achievements

---

## 🧠 How It Works

```
Student
   ↓
Notes or PDF
   ↓
Next.js app (React UI)
   ↓
Server-side API route
   ↓
Google Gemini  (or unpdf for PDF text only)
   ↓
Structured result in the UI
   ↓
Optional save → browser localStorage
   ↓
Dashboard / History / Progress
```

Gemini is called only from **server** routes. For PDFs, `/api/pdf` extracts text first. Later AI calls (summary, quiz, flashcards, Ask AI) send that **text**, not the PDF file.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) 16 (App Router) | Pages, layouts, and API routes |
| [React](https://react.dev/) 19 | UI and client state |
| JavaScript / JSX | Application code (`app/` and `components/`) |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Layout and styling |
| [Google Gemini](https://ai.google.dev/) (`gemini-3.1-flash-lite`) | Summaries, quizzes, flashcards, PDF Q&A |
| [`@google/genai`](https://www.npmjs.com/package/@google/genai) | Official Gemini SDK on the server |
| [`unpdf`](https://www.npmjs.com/package/unpdf) | Server-side PDF text extraction |
| `localStorage` | Study history and analytics in the browser |

---

## 📂 Project Structure

```
ai-study-assistant/
├── app/
│   ├── api/
│   │   ├── summarize/route.js    # POST notes → Gemini summary
│   │   ├── quiz/route.js         # POST notes → Gemini quiz
│   │   ├── flashcards/route.js   # POST notes → Gemini cards
│   │   └── pdf/
│   │       ├── route.js          # POST file → extracted text
│   │       └── ask/route.js      # POST question + pdfText → Gemini
│   ├── flashcards/page.jsx
│   ├── history/page.jsx
│   ├── pdf/page.jsx
│   ├── progress/page.jsx
│   ├── quiz/page.jsx
│   ├── summarizer/page.jsx
│   ├── timer/page.jsx
│   ├── layout.jsx
│   ├── page.jsx                  # Dashboard
│   └── globals.css
├── components/                   # Dashboard, tools, PDF, timer, progress, shell
├── data/sampleData.js            # Profile + dashboard tool cards
├── lib/
│   ├── ai/                       # Gemini helpers (summarize, quiz, flashcards, PDF ask)
│   ├── pdf/                      # Extraction + size limits
│   ├── studyHistory.js           # localStorage history + stats
│   └── useStudyHistory.js        # Client hook (avoids SSR localStorage)
├── package.json
└── README.md
```

---

## 🔑 Environment Variables

Create **`.env.local`** in the project root (do not commit it):

```env
GEMINI_API_KEY=your_gemini_api_key
```

- Read only on the **server** via `process.env.GEMINI_API_KEY`
- Do **not** use `NEXT_PUBLIC_GEMINI_API_KEY`
- `.gitignore` includes `.env*`, so `.env.local` stays out of Git

---

## 🚀 Getting Started

Requires Node.js and a Gemini API key.

```bash
git clone <repository-url>
cd ai-study-assistant
npm install
```

Create `.env.local` and set `GEMINI_API_KEY` (see above).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Script | Command |
|---|---|
| Development | `npm run dev` |
| Production build | `npm run build` |
| Start production server | `npm start` |
| Lint | `npm run lint` |

---

## 📡 API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/summarize` | `POST` | JSON `{ notes, summaryLength }` → `{ summary }` |
| `/api/quiz` | `POST` | JSON `{ notes, questionCount, difficulty }` → `{ questions }` |
| `/api/flashcards` | `POST` | JSON `{ notes, cardCount }` → `{ flashcards }` |
| `/api/pdf` | `POST` | `FormData` field `file` → extracted text (no Gemini) |
| `/api/pdf/ask` | `POST` | JSON `{ question, pdfText }` → `{ answer }` |

---

## 📚 Study History & Analytics

History is stored in the browser under `ai-study-assistant-history` (`localStorage`). Session types: `summary`, `quiz`, `flashcards`, `timer`.

Saves happen when you choose **Save to Study History**, finish a quiz, complete a Focus/Deep Study timer, or save a flashcard review—not on every AI request. PDF Ask AI Q&A is **not** written to history.

The dashboard and Progress page subscribe to the same client-side history (including a `study-history-updated` event) so stats, streak, weekly activity, and achievements update without a database.

---

## 🔐 Security & Privacy Notes

- Gemini key lives in `.env.local` / the host environment, not in client bundles
- AI routes run on the server; the browser never sends the key
- `.env.local` is gitignored
- PDF upload is parsed on the server; Gemini receives extracted text only
- Study history stays in **this browser** unless you add a backend later

This is a student project, not an enterprise security audit.

---

## 🎯 Learning Outcomes

- Next.js App Router pages and route handlers
- React component composition and client state
- Server-side Gemini integration (`@google/genai`)
- PDF extraction with `unpdf`
- Client persistence and derived analytics
- Validation and user-facing API error handling
- Layout that works on desktop, tablet, and mobile

---

## 🔮 Future Improvements

*Not implemented yet.*

- User authentication
- Database-backed history and cloud sync
- Spaced repetition
- Study reminders
- Stronger handling of very large PDFs
- Optional extra models or providers

---

## 📸 Screenshots

Add images here when you capture them (for example under `docs/` or `public/`).

<!-- Add dashboard screenshot here -->
<!-- Suggested filename: dashboard.png -->

<!-- Add summarizer screenshot here -->
<!-- Suggested filename: summarizer.png -->

<!-- Add quiz screenshot here -->
<!-- Suggested filename: quiz.png -->

<!-- Add flashcards screenshot here -->
<!-- Suggested filename: flashcards.png -->

<!-- Add PDF study screenshot here -->
<!-- Suggested filename: pdf-study.png -->

<!-- Add study timer screenshot here -->
<!-- Suggested filename: timer.png -->

<!-- Add study history screenshot here -->
<!-- Suggested filename: history.png -->

<!-- Add progress analytics screenshot here -->
<!-- Suggested filename: progress.png -->

---

## 🌐 Deployment

This is a standard Next.js app and can be deployed on [Vercel](https://vercel.com/). The repository does **not** include a public production URL.

In the Vercel project settings, add:

```
GEMINI_API_KEY
```

Redeploy after setting the variable. Keep it a **server** secret (not `NEXT_PUBLIC_`).

---

## 👩‍💻 Author

**Aashi Tyagi**

- GitHub: [github.com/aashi1317](https://github.com/aashi1317)
- LinkedIn: [linkedin.com/in/aashi-tyagi-59891b26b](https://www.linkedin.com/in/aashi-tyagi-59891b26b)
- LeetCode: [leetcode.com/u/aashityagi](https://leetcode.com/u/aashityagi/)

---

## 📄 License

This repository currently **does not specify a license**.
