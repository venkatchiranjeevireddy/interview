# Interview Feature - Testing Guide

## Pre-Testing Checklist

- [ ] Google API key added to `server/.env` and `client/.env`
- [ ] Both `.env` files have keys: `GOOGLE_API_KEY` and `VITE_GOOGLE_API_KEY`
- [ ] Database migration executed (interviews table created)
- [ ] npm install completed in both server and client directories
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173 (Vite default)
- [ ] Browser allows microphone access

## Testing Workflow

### 1. Navigation Test
1. Start the app and log in
2. Click "Interview Prep" on welcome screen
3. Verify:
   - ✅ Interview page loads with job description input
   - ✅ Difficulty selection cards appear
   - ✅ Navigation back button works

### 2. Job Description & Resume Test
1. On Interview page, paste a job description
2. Select a previously uploaded resume
3. Verify:
   - ✅ Resume content is populated
   - ✅ JD is editable
   - ✅ Difficulty cards appear below

### 3. Difficulty Selection Test
1. Try clicking BASIC level card
2. Verify:
   - ✅ Card shows selected state (highlighted)
   - ✅ MEDIUM level is locked (grayed out)
   - ✅ HARD level is locked (grayed out)

### 4. Interview Session Test
1. Click "Start Interview" on BASIC level
2. Allow microphone access when prompted
3. Verify during interview:
   - ✅ AI introduces itself within 5 seconds
   - ✅ Questions appear in transcript area
   - ✅ Your responses are transcribed
   - ✅ Timer counts down correctly
   - ✅ Audio feedback is audible from AI
   - ✅ "Finish Interview" button is available

### 5. Interview Completion Test
1. Let interview run for 1-2 exchanges
2. Click "Finish Interview"
3. Verify:
   - ✅ Interview session closes
   - ✅ Evaluation starts (shows loading)
   - ✅ Results page appears after 5-10 seconds
   - ✅ Scores displayed (0-100 for each category)

### 6. Results & Feedback Test
1. On results page, verify displays:
   - ✅ Overall score percentage
   - ✅ Technical score
   - ✅ Communication score
   - ✅ Alignment score
   - ✅ Radar chart visualization
   - ✅ Feedback text
   - ✅ Suggestions list
   - ✅ Question breakdown with ratings

### 7. Database Storage Test
1. After interview completes, check Supabase:
   - Query: `SELECT * FROM interviews WHERE user_id = <your_uuid>`
   - Verify:
     - ✅ Interview record created
     - ✅ All scores saved
     - ✅ Transcript saved
     - ✅ Feedback and suggestions saved
     - ✅ Question breakdown saved as JSON

### 8. Profile Integration Test
1. From results, click "Back to Difficulty Selection"
2. Verify BASIC card now shows your score
3. Verify MEDIUM card is now unlocked (if score >= 80)
4. Try selecting MEDIUM level
5. Run a short MEDIUM interview

### 9. Interview History Test
1. Complete 2-3 interviews at different levels
2. Check backend history endpoint:
   - `GET /api/v1/interviews/history`
   - Verify returns array of all interviews
   - Verify interview count matches completed interviews

### 10. Error Handling Test
1. Try without microphone access - verify error message
2. Try with blank job description - verify validation
3. Try with no resume selected - verify button disabled
4. Interrupt network during interview - verify graceful handling

## API Endpoints to Test (with curl/Postman)

### Generate Questions
```bash
curl -X POST http://localhost:5000/api/v1/interviews/1/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "BASIC",
    "jd": "Senior Developer required...",
    "resume": "John Doe, 5 years experience..."
  }'
```

### Evaluate Interview
```bash
curl -X POST http://localhost:5000/api/v1/interviews/1/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "AI: Tell me about yourself\nUser: I have 5 years..."
  }'
```

### Store Interview Result
```bash
curl -X POST http://localhost:5000/api/v1/interviews/1/store \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level": "BASIC",
    "transcript": "AI: ...\nUser: ...",
    "result": {
      "score": 75,
      "technical": 70,
      "communication": 80,
      "alignment": 75,
      "suggestions": [],
      "feedback": "",
      "questionBreakdown": []
    }
  }'
```

## Expected Behavior

### BASIC Level (15 min)
- Questions focus on: background, resume verification, cultural fit
- AI paces 5 questions in 15 minutes
- Unlock threshold: 80%

### MEDIUM Level (30 min)
- Questions focus on: technical skills, problem-solving, role-specific
- AI paces 8 questions in 30 minutes
- Unlock threshold: 80%
- Prerequisite: BASIC score >= 80%

### HARD Level (45 min)
- Questions focus on: architecture, edge cases, leadership
- AI paces 10 questions in 45 minutes
- Prerequisite: MEDIUM score >= 80%

## Common Issues & Solutions

### Issue: "Audio not working"
- **Solution**: Check browser microphone permissions, ensure HTTPS on production

### Issue: "Gemini API errors"
- **Solution**: Verify API key is correct, check quota limits on Google Cloud Console

### Issue: "Transcript not appearing"
- **Solution**: Wait 2-3 seconds after AI speaks, check network latency

### Issue: "Database migration failed"
- **Solution**: Run migration in Supabase SQL Editor, check table permissions

### Issue: "Results page blank"
- **Solution**: Check browser console for errors, ensure evaluation API responded

## Performance Metrics to Monitor

- Interview session startup time: < 5 seconds
- AI response latency: 2-5 seconds per question
- Transcript update latency: < 1 second
- Result storage latency: < 2 seconds
- Total interview completion time: as configured (15/30/45 min)

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ❌ IE 11 (not supported)

## Notes

- **Microphone Required**: Users must allow microphone access
- **Network Latency**: Interview quality depends on stable internet
- **API Costs**: Each interview calls Gemini API (costs apply)
- **Session Storage**: Interview data stored in Supabase (encrypted)
- **Concurrent Interviews**: No limit on concurrent interviews per user
