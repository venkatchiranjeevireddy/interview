# ResumeATS + Interview Prep

All-in-one platform for resume scoring (ATS) and AI-powered interview practice.

## Features
- Email signup with OTP verification
- Secure login + password reset via email code
- Resume upload (PDF/DOCX) and management
- ATS scoring with missing keywords and suggestions
- Live AI interview (voice) with real-time transcript
- Interview evaluation with scores and feedback
- Subscription tiers (Basic vs Premium) with limits
- 3-month Premium trial with auto-expiry
- Usage tracking (daily limits)
- ATS + Interview history view

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL + Storage)
- AI: Groq (ATS/Interview evaluation), Google Gemini Live Audio

## Project Structure
- client/ — React app
- server/ — Express API
- migrations/ — SQL migrations

## Setup
1. Install dependencies:
   - client: `npm install`
   - server: `npm install`
2. Configure environment variables in server/.env and client/.env
3. Run database migrations in Supabase SQL editor
4. Start servers:
   - server: `npm run dev`
   - client: `npm run dev`

## Environment Variables (Server)
Required:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET
- GROQ_API_KEY
- GOOGLE_API_KEY

Email (for OTP + password reset):
- EMAIL_USER
- EMAIL_PASSWORD
- OTP_EXPIRY

## Notes
- Premium trial auto-downgrades to Basic after 3 months.
- Daily usage limits enforce Basic plan restrictions.

## License
MIT
