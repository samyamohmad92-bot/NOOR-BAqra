# نور البقرة — Noor Al-Baqara

## Overview

A full-stack Quran memorization platform for Surah Al-Baqara. Students can track their memorization sessions, supervisors can manage their students, and admins can oversee everything.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/noor-albaqara)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **State management**: Zustand (auth store)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## User Roles

1. **Student** — login/register, track memorization progress, do recitation sessions
2. **Supervisor** — login, view students, reset passwords, add students
3. **Admin** — login (phone: `admin`, password: `admin123`), manage all students and supervisors

## Demo Credentials

- **Student**: phone `0501234567`, password `123456`
- **Supervisor**: phone `0500000000`, password `123456`
- **Admin**: phone `admin`, password `admin123`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── noor-albaqara/      # React + Vite frontend (serves at /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `students` — student accounts (id, name, phone, password, country, gender, tajweed_level, supervisor_id)
- `student_progress` — tracking (current_wajh, correct_count, current_session, total_stars, waiting_teacher, hashd_completed, test_attempts)
- `supervisors` — supervisor accounts (id, name, phone, password)
- `admins` — admin accounts (id, phone, password)

## Business Logic

- **TARGET_ATTEMPTS** = 8 correct recitations per wajh
- **MAX_SESSIONS** = 3 sessions per wajh (if all fail, reset progress)
- After 8 correct: set `waiting_teacher=true`, require teacher confirmation
- **Mushaf blur levels** based on `correctCount`: 0-1 = visible, 2-4 = partial blur, 5+ = full blur
- Stars system: earned after completing hashd and wajhs

## Key API Routes

- `POST /api/auth/student/login`
- `POST /api/auth/student/register`
- `POST /api/auth/supervisor/login`
- `POST /api/auth/admin/login`
- `GET/PATCH /api/progress/:studentId`
- `GET /api/leaderboard`
- `GET /api/students`
- `POST /api/students/:id/reset-password`
- `GET/POST /api/supervisors`
