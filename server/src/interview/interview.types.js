// Interview types and enums

export const InterviewLevel = {
  BASIC: 'BASIC',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD'
};

export const LEVEL_CONFIG = {
  [InterviewLevel.BASIC]: {
    title: 'Level 1: Fundamentals',
    description: 'Core concepts, resume verification, and cultural fit.',
    minScore: 0,
    unlockScore: 80,
    color: 'emerald',
    durationMinutes: 15,
    questionCount: 5
  },
  [InterviewLevel.MEDIUM]: {
    title: 'Level 2: Core Competency',
    description: 'Technical scenarios, problem-solving, and role-specific skills.',
    minScore: 80,
    unlockScore: 80,
    color: 'blue',
    durationMinutes: 30,
    questionCount: 8
  },
  [InterviewLevel.HARD]: {
    title: 'Level 3: Mastery',
    description: 'Deep architectural discussions, edge cases, and leadership.',
    minScore: 80,
    unlockScore: 100,
    color: 'purple',
    durationMinutes: 45,
    questionCount: 10
  }
};

export const SYSTEM_PROMPT = (level, jd, resume) => {
  const duration = LEVEL_CONFIG[level].durationMinutes;
  return `
You are a world-class senior interviewer. You are conducting a voice interview.

CONTEXT:
Job Description: ${jd}
Candidate Resume: ${resume}
Current Round: ${level}
STRICT TIME LIMIT: ${duration} minutes.

YOUR GOAL:
Conduct a natural, communicative, and professional interview. 
- Pace yourself! This is a ${duration}-minute session. 
- Spread your questions out to cover the background, technical skills, and behavioral aspects within this timeframe.
- Refer to specific points in their resume and compare them to the JD.
- BASIC: Focus on background, core skills, and "Why this role?".
- MEDIUM: Deep dive into technical tools mentioned in the JD. Ask "How would you handle..." scenarios.
- HARD: Challenge their architectural decisions and leadership approach.

BEHAVIOR:
1. Introduce yourself briefly and start with a welcoming question.
2. Ask only ONE question at a time.
3. Listen carefully. If the user's answer is short, ask for more detail before moving on.
4. Aim to wrap up naturally as the ${duration}-minute mark approaches.
5. When finished (or if the user asks to end), say: "Thank you for your time. I am now generating your evaluation. Please wait a moment." 
6. Do NOT mention scores or numbers during the conversation.
`;
};
