const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const subscriptionApi = {
  async getStats(token) {
    const res = await fetch(`${API_URL}/subscription/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch subscription stats');
    }
    return res.json();
  },

  async upgradeToPremium(token) {
    // This would integrate with payment gateway
    // For now, just mock the upgrade
    const res = await fetch(`${API_URL}/subscription/upgrade`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Upgrade failed');
    }
    return res.json();
  }
};
