// History API service
import { API_BASE_URL } from '../api.js';

const HISTORY_API = `${API_BASE_URL}/api/v1`;

export const historyApi = {
  getAtsHistory: async (token) => {
    const res = await fetch(`${HISTORY_API}/resumes/history/ats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch ATS history');
    return res.json();
  },

  getInterviewHistory: async (token) => {
    const res = await fetch(`${HISTORY_API}/interviews/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch interview history');
    return res.json();
  },

  getInterviewDetail: async (token, interviewId) => {
    const res = await fetch(`${HISTORY_API}/interviews/${interviewId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch interview detail');
    return res.json();
  }
};
