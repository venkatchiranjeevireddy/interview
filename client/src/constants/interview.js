export const LEVEL_CONFIG = {
  BASIC: {
    title: 'Level 1: Fundamentals',
    description: 'Core concepts, resume verification, and cultural fit.',
    minScore: 0,
    unlockScore: 80,
    color: 'emerald',
    durationMinutes: 15
  },
  MEDIUM: {
    title: 'Level 2: Core Competency',
    description: 'Technical scenarios, problem-solving, and role-specific skills.',
    minScore: 80,
    unlockScore: 80,
    color: 'blue',
    durationMinutes: 30
  },
  HARD: {
    title: 'Level 3: Mastery',
    description: 'Deep architectural discussions, edge cases, and leadership.',
    minScore: 80,
    unlockScore: 100,
    color: 'purple',
    durationMinutes: 45
  }
};

export const SYSTEM_PROMPT = (level, jd, resume) => {
  return `You are an expert technical interviewer conducting a ${level} level interview.

Job Description:
${jd}

Candidate's Resume:
${resume}

Your role:
- Ask relevant questions matching the ${LEVEL_CONFIG[level].durationMinutes}-minute ${level} level interview
- Listen carefully to responses and ask follow-up questions
- Be conversational and professional
- Focus on: ${LEVEL_CONFIG[level].description}
- Do NOT repeat questions
- Keep questions concise and clear

Start by greeting the candidate and asking your first question.`;
};
