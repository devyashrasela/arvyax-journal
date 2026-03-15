const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function createEntry(userId, ambience, text) {
  return request("/api/journal", {
    method: "POST",
    body: JSON.stringify({ userId, ambience, text }),
  });
}

export function getEntries(userId) {
  return request(`/api/journal/${encodeURIComponent(userId)}`);
}

export function analyzeText(text) {
  return request("/api/journal/analyze", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function getInsights(userId) {
  return request(`/api/journal/insights/${encodeURIComponent(userId)}`);
}
