# Interview Feature Integration Guide

## What Was Added

### Backend (Express + Node.js)
1. **Interview Service** (`server/src/interview/interview.service.js`)
   - Generates AI questions from JD + Resume
   - Evaluates interview transcripts using Google Gemini
   - Extracts text from PDF resumes
   - Stores interview results in database

2. **Interview Routes** (`server/src/interview/interview.routes.js`)
   - `POST /interviews/:resumeId/questions` - Generate interview questions
   - `POST /interviews/:resumeId/evaluate` - Evaluate transcript
   - `POST /interviews/:resumeId/store` - Store results
   - `GET /interviews/history` - Get interview history
   - `GET /interviews/:interviewId` - Get specific interview

3. **Interview Types** (`server/src/interview/interview.types.js`)
   - Difficulty levels (BASIC, MEDIUM, HARD)
   - Level configurations with durations
   - System prompts for different levels

### Frontend (React + Vite)
1. **Interview Components**
   - `DifficultyCard.jsx` - Display difficulty levels
   - `InterviewSession.jsx` - Real-time voice interview with Google's Gemini Live API
   - `Interview.jsx` - Main interview flow manager

2. **Interview Service** (`client/src/services/interview.js`)
   - API calls to backend interview endpoints

3. **Audio Utilities** (`client/src/services/audio.js`)
   - PCM audio encoding/decoding
   - Audio buffer management

4. **Dashboard Integration**
   - Interview button in welcome screen
   - Interview button in ATS section
   - New interview view with all features

### Database
1. **interviews table** with fields:
   - user_id, resume_id, level
   - technical_score, communication_score, alignment_score, overall_score
   - transcript, feedback, suggestions, question_breakdown
   - created_at, updated_at

## Setup Instructions

### 1. Get Google API Key
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key with access to Gemini API
- Copy the key

### 2. Update Environment Variables
**Server** (`.env`):
```
GOOGLE_API_KEY=your_google_api_key_here
```

**Client** (`.env`):
```
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Install Dependencies
```bash
# Server
cd server
npm install

# Client
cd client
npm install
```

### 4. Run Database Migration
Execute the SQL migration to create the interviews table:
- File: `migrations/001_create_interviews_table.sql`
- Run in Supabase SQL Editor

### 5. Start the Application
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## Features

### Interview Flow
1. **Upload Resume** - Select from your uploaded resumes
2. **Enter Job Description** - Paste the job posting
3. **Select Difficulty** - Choose BASIC, MEDIUM, or HARD
   - BASIC: 15 minutes, unlock MEDIUM at 80%
   - MEDIUM: 30 minutes, unlock HARD at 80%
   - HARD: 45 minutes, challenges architectural decisions
4. **Live Interview** - Real-time voice interaction with AI
   - Microphone input with live transcription
   - AI responses with audio
   - Timer for interview duration
5. **Results** - See scores and feedback
   - Technical, Communication, Alignment scores
   - Question-by-question breakdown
   - Suggestions for improvement
   - Radar chart visualization

### Interview AI Behavior
- Natural conversation flow
- Personalized questions based on resume & JD
- Adaptive difficulty matching
- Professional interviewer persona
- Time-aware question pacing

## Files Modified/Created

### Backend
- ✅ `server/src/interview/interview.service.js` (NEW)
- ✅ `server/src/interview/interview.routes.js` (NEW)
- ✅ `server/src/interview/interview.types.js` (NEW)
- ✅ `server/src/app.js` (UPDATED - added interview routes)
- ✅ `server/package.json` (UPDATED - added @google/genai)
- ✅ `server/.env` (UPDATED - added GOOGLE_API_KEY)

### Frontend
- ✅ `client/src/components/interview/DifficultyCard.jsx` (NEW)
- ✅ `client/src/components/interview/InterviewSession.jsx` (NEW)
- ✅ `client/src/components/interview/Interview.jsx` (NEW)
- ✅ `client/src/services/interview.js` (NEW)
- ✅ `client/src/services/audio.js` (NEW)
- ✅ `client/src/pages/Dashboard.jsx` (UPDATED - added interview view & button)
- ✅ `client/package.json` (UPDATED - added @google/genai & recharts)
- ✅ `client/.env` (NEW)

### Database
- ✅ `migrations/001_create_interviews_table.sql` (NEW)

## Next Steps

1. Add your Google API key to both `.env` files
2. Run the database migration
3. Install dependencies with npm install
4. Start the backend and frontend servers
5. Click "Interview Prep" button on the dashboard
6. Select a resume and paste a job description
7. Choose difficulty level and start interviewing!

## Tech Stack
- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **AI/ML**: Google Gemini 2.5 (Live Audio API)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Audio Processing**: Web Audio API + PCM encoding
