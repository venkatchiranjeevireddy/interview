const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const interviewApi = {
  generateQuestions: async (resumeId, level, jd, resume, token) => {
    const response = await fetch(`${API_URL}/interviews/${resumeId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ level, jd, resume })
    });
    if (!response.ok) throw new Error('Failed to generate questions');
    return response.json();
  },

  evaluateInterview: async (resumeId, transcript, token) => {
    const response = await fetch(`${API_URL}/interviews/${resumeId}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ transcript })
    });
    if (!response.ok) throw new Error('Failed to evaluate interview');
    return response.json();
  },

  storeResult: async (resumeId, level, transcript, result, token) => {
    const response = await fetch(`${API_URL}/interviews/${resumeId}/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ level, transcript, result })
    });
    if (!response.ok) throw new Error('Failed to store interview result');
    return response.json();
  },

  getHistory: async (token) => {
    const response = await fetch(`${API_URL}/interviews/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch interview history');
    return response.json();
  },

  getDetail: async (interviewId, token) => {
    const response = await fetch(`${API_URL}/interviews/${interviewId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch interview detail');
    return response.json();
  }
};
