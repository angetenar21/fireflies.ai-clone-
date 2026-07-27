# Meeting Notes & Transcription Platform (Fireflies.ai Clone)

A full-stack Fireflies.ai-style meeting notes and transcription web application built as an SDE Fullstack Assignment. The platform replicates core post-meeting workflows: browsing a meeting library, reviewing interactive transcripts synced to a media player, and managing AI-generated summaries, key topics, and action items — all with a clean, productivity-focused interface.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, Axios, Zustand, Lucide React |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.x, Pydantic v2, Uvicorn |
| **Database** | SQLite (`backend/data/meetings.db`) |
| **AI / LLM** | Groq API (`llama-3.1-8b-instant`) for the "Ask about this meeting" chat feature |

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # macOS / Linux
# venv\Scripts\activate        # Windows

pip install -r requirements.txt
```

Seed sample data (creates and populates the SQLite DB):

```bash
python -m app.seed
```

Start the API server:

```bash
uvicorn app.main:app --reload --port 8000
```

- API base URL: `http://localhost:8000`
- Interactive Swagger docs: `http://localhost:8000/docs`
- Health check: `GET /health`

Tables are auto-created on first startup via `Base.metadata.create_all`. The seed script is **idempotent** — safe to re-run; it clears existing rows first.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: `http://localhost:3000`

Optional env override (defaults to `http://localhost:8000`):

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Architecture Overview

### Folder Structure

```
fireflies.ai_clone/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, /health, mounts /api
│   │   ├── models.py            # SQLAlchemy ORM models (custom schema)
│   │   ├── schemas.py           # Pydantic v2 request/response schemas
│   │   ├── auth_utils.py        # Demo user management (default logged-in user)
│   │   ├── seed.py              # Realistic sample data seeder
│   │   ├── init_db.py           # Explicit table creation helper
│   │   ├── db/
│   │   │   └── session.py       # Engine, SessionLocal, get_db dependency
│   │   ├── routers/
│   │   │   ├── meetings.py      # Meeting CRUD + star toggle
│   │   │   ├── action_items.py  # Nested action-item CRUD with priority
│   │   │   ├── ask.py           # Groq LLM "ask about meeting" endpoint
│   │   │   ├── search.py        # Global full-text search
│   │   │   ├── annotations.py   # Highlights, comments, soundbites
│   │   │   └── auth.py          # Demo user / /me endpoint
│   │   └── services/
│   │       └── meetings.py      # Business logic: serialization, transcript parsing
│   ├── data/
│   │   └── meetings.db          # SQLite database (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── public/audio/            # Sample meeting audio for the player
│   └── src/
│       ├── app/(app)/           # Next.js App Router pages
│       │   ├── meetings/        # Meetings library page
│       │   ├── meetings/[id]/   # Meeting detail (transcript + summary + AI chat)
│       │   ├── live/            # Placeholder: live meeting status
│       │   ├── integrations/    # Placeholder: Zoom/Meet/Calendar
│       │   ├── voice-agents/    # Placeholder: AI voice bots
│       │   ├── ai-apps/         # Placeholder: AI skills hub
│       │   └── settings/        # Placeholder: user settings
│       ├── components/
│       │   ├── layout/          # AppShell, Sidebar, TopBar
│       │   ├── meetings/        # MeetingCard, Detail, Transcript, ActionItems
│       │   ├── brand/           # Logo component
│       │   └── ui/              # Toast, Modal, shared UI components
│       ├── lib/
│       │   ├── api.ts           # Axios client (base URL from env)
│       │   ├── meetings.ts      # Typed REST API helpers
│       │   └── types.ts         # Shared TypeScript types
│       └── store/               # Zustand stores for UI state
└── README.md
```

### Request Flow

```
Browser (Next.js :3000)
    │  Axios HTTP/JSON
    ▼
FastAPI (:8000)  →  /api/* routers  →  SQLAlchemy ORM  →  SQLite
                        │
                    Groq API (LLM) — for /ask endpoint
```

1. The **Axios client** reads `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).
2. **Typed helpers** in `lib/meetings.ts` call REST paths under `/api/...`.
3. **CORS** allows `http://localhost:3000` and `http://127.0.0.1:3000`.
4. All requests are authenticated as a default demo user (`Manish Kumar`) — no login required per the spec.
5. The **media player** syncs with `transcript_lines.start_time_seconds`. Clicking a transcript line seeks the player and vice versa.

### Main UI Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/meetings` (dashboard) |
| `/meetings` | Meetings library — search, date filter, sort, tag filter |
| `/meetings/[id]` | Detail view: player, transcript, summary, action items, AI chat |
| `/live` | Placeholder — live meeting status |
| `/integrations` | Placeholder — Zoom, Google Meet, calendar |
| `/voice-agents` | Placeholder — AI bot configuration |
| `/ai-apps` | Placeholder — AI skills / Daily Digest |
| `/settings` | Placeholder — user profile & settings |

---

## Database Schema

SQLite file at `backend/data/meetings.db`. Foreign key enforcement is enabled with `PRAGMA foreign_keys=ON`.

### Entity Relationships

```
participants ←──M:N──→ meetings ←──M:N──→ tags
                          │
        ┌─────────────────┼──────────────────┬──────────────┐
        ▼                 ▼                  ▼              ▼
     speakers      transcript_lines      summaries      key_topics
        ▲                 │              (1:1)
        └─────────────────┘
                    action_items (N:1 meeting)
                    transcript_highlights (N:1 meeting + line)
                    transcript_comments   (N:1 meeting + line)
                    soundbites            (N:1 meeting + line)
```

### Table Descriptions

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | `id`, `name`, `email`, `password_hash`, `created_at` | One demo user auto-created at seed time |
| `auth_sessions` | `id`, `token`, `user_id`, `expires_at` | Session token store |
| `meetings` | `id`, `title`, `date`, `duration_minutes`, **`is_starred`**, `owner_id`, `created_at`, `updated_at` | `is_starred` (BOOLEAN) — custom field: user can bookmark important meetings. M:N with participants via `meeting_participants`; M:N with tags via `meeting_tags` |
| `participants` | `id`, `name`, `email` | Shared across meetings; unique email |
| `meeting_participants` | `meeting_id`, `participant_id` | M:N join table (CASCADE on delete) |
| `speakers` | `id`, `meeting_id`, `name`, `color` | Per-meeting speaker labels with UI display color; unique `(meeting_id, name)` |
| `transcript_lines` | `id`, `meeting_id`, `speaker_id`, `start_time_seconds`, `end_time_seconds`, `text`, `order_index` | Timestamped transcript segments; player sync via `start_time_seconds` |
| `summaries` | `id`, `meeting_id`, `overview_text`, `generated_at` | One per meeting (1:1); can be seeded, uploaded, or LLM-generated |
| `key_topics` | `id`, `meeting_id`, `topic_text`, `order_index` | Ordered chapter/topic list for the meeting |
| `action_items` | `id`, `meeting_id`, `text`, `assignee`, `is_completed`, **`priority`**, `created_at` | `priority` (VARCHAR: `high` / `medium` / `low`) — custom field: allows triaging tasks by urgency |
| `tags` | `id`, `name` | Global tags; unique name |
| `meeting_tags` | `meeting_id`, `tag_id` | M:N join table (CASCADE on delete) |
| `transcript_highlights` | `id`, `meeting_id`, `transcript_line_id`, `created_at` | Bookmarked transcript lines (bonus feature) |
| `transcript_comments` | `id`, `meeting_id`, `transcript_line_id`, `body`, `author_name`, `created_at`, `updated_at` | Inline comments on transcript lines (bonus feature) |
| `soundbites` | `id`, `meeting_id`, `transcript_line_id`, `label`, `start_time_seconds`, `end_time_seconds`, `created_at` | Clipped audio segments (bonus feature) |

### Custom Schema Additions

Two fields were added beyond the standard Fireflies-like schema to demonstrate original design decisions:

1. **`meetings.is_starred` (BOOLEAN, default `false`)** — allows users to star/bookmark important meetings. Exposed via `PATCH /api/meetings/{id}/star` which toggles the value. Starred meetings could be surfaced at the top of the library.

2. **`action_items.priority` (VARCHAR: `high` | `medium` | `low`, default `medium`)** — adds urgency triaging to action items. Enforced at both the API (Pydantic regex validation) and seed level. Each action item in the seed data is assigned a contextually appropriate priority.

---

## API Endpoint Reference

All routes are under the `/api` prefix (except `/health`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `GET` | `/api/auth/me` | Current user info |
| `GET` | `/api/meetings` | List meetings. Query params: `q`, `date_from`, `date_to`, `tag`, `sort` |
| `GET` | `/api/meetings/{id}` | Full meeting detail |
| `POST` | `/api/meetings` | Create meeting (supports pasted transcript text or structured lines) |
| `PUT` | `/api/meetings/{id}` | Update meeting metadata |
| `PATCH` | `/api/meetings/{id}/star` | Toggle `is_starred` bookmark |
| `DELETE` | `/api/meetings/{id}` | Delete meeting and all children |
| `POST` | `/api/meetings/{id}/action-items` | Create action item (with `priority`) |
| `PUT` | `/api/meetings/{id}/action-items/{item_id}` | Update action item (text, assignee, is_completed, priority) |
| `DELETE` | `/api/meetings/{id}/action-items/{item_id}` | Delete action item |
| `POST` | `/api/meetings/{id}/ask` | Ask a question about the meeting (Groq LLM) |
| `GET` | `/api/search?q=` | Full-text search across meetings and transcripts |

Interactive OpenAPI docs: `http://localhost:8000/docs`

---

## Bonus Features Implemented

| Feature | Status |
|---------|--------|
| ✅ LLM-powered "Ask about this meeting" | Groq `llama-3.1-8b-instant` via `/ask` endpoint |
| ✅ Dark mode | Full dark/light theme toggle |
| ✅ Global search | `GET /api/search` + UI search bar |
| ✅ Tags & filtering | Tag model, M:N relationship, filter in list API |
| ✅ Comments on transcript lines | `transcript_comments` table + API |
| ✅ Highlights / soundbites | `transcript_highlights`, `soundbites` tables |
| ✅ Export transcript | Available in meeting detail UI |
| ⬜ PDF export | Not implemented |

---

## Demo Account

| Field | Value |
|-------|-------|
| **Name** | Manish Kumar |
| **Email** | `manish@quantumcorp.io` |
| **Password** | `Demo@1234` |

This account owns **6 seeded meetings** complete with transcripts, summaries, key topics, action items, and tags.

---

## Assumptions & Design Decisions

- **Authentication** — As specified, a default demo user is always logged in. No login UI; the backend auto-creates and returns the demo user on every request.
- **Mocked Transcription** — No live STT/ASR. Transcripts come from seed data or can be pasted/uploaded via the Create Meeting form.
- **AI Summaries** — Summaries, key topics, and action items are seeded. For the "Ask" feature, the Groq LLM is queried at request time with the meeting's context (summary + transcript excerpt).
- **Audio** — The media player uses a shared sample audio file. Per-meeting recordings are out of scope.
- **SQLite** — Appropriate for local demo; no migrations tooling required.
- **Placeholders** — Live bot, real-time integrations, team sharing, and settings pages are present as "Coming Soon" placeholders.
- **CORS** — Allows `localhost:3000` for local development.

---

## AI Tools Used

This project was developed with heavy AI assistance (GitHub Copilot, Claude, ChatGPT) for boilerplate, component wiring, and schema design, in accordance with the assignment's stated guidelines. All code was reviewed, understood, and is explainable line-by-line.
