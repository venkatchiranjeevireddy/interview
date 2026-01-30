import crypto from 'crypto';

const STOPWORDS = new Set([
  'the', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'a', 'an', 'with', 'by',
  'is', 'are', 'this', 'that', 'as', 'at', 'be', 'from', 'will', 'can', 'should',
]);

const normalize = (text = '') => text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

const extractKeywords = (text, max = 20) => {
  const counts = new Map();
  normalize(text)
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word))
    .forEach((word) => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
};

export const runSimpleAts = (jobDescription, resumeText) => {
  const jdKeywords = extractKeywords(jobDescription, 25);
  if (jdKeywords.length === 0) {
    return {
      score: 0,
      missing_keywords: [],
      suggestions: ['Provide a clearer job description to assess match.'],
    };
  }

  const resumeWords = new Set(normalize(resumeText).split(/\s+/).filter(Boolean));
  const present = jdKeywords.filter((kw) => resumeWords.has(kw));
  const missing = jdKeywords.filter((kw) => !resumeWords.has(kw));

  const rawScore = (present.length / jdKeywords.length) * 100;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const suggestions = missing.slice(0, 8).map((kw) => `Add evidence of '${kw}' if relevant to your experience.`);
  if (suggestions.length === 0) {
    suggestions.push('Great alignment. Emphasize your most relevant achievements for this JD.');
  }

  return {
    score,
    missing_keywords: missing.slice(0, 12),
    suggestions,
  };
};

export const generateResumeKey = (userId, originalName = 'resume') => {
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  return `${userId}/${crypto.randomUUID()}-${safeName}`;
};
