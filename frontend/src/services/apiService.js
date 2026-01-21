const API_BASE = 'http://localhost:5000/api';

async function fetchJson(url, opts) {
  const token = localStorage.getItem('token');
  const headers = (opts && opts.headers) ? { ...opts.headers } : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(url, { ...(opts||{}), headers });
  
  // Handle empty or non-json responses safely
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(json?.message || 'API error');
    err.status = res.status;
    throw err;
  }
  return json;
}

const apiService = {
  login: (email, password) => 
    fetchJson(`${API_BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }),

  signup: (email, password, role) => 
    fetchJson(`${API_BASE}/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, role }) }),

  getExams: () => fetchJson(`${API_BASE}/exams`),

  createExam: (examData) => 
    fetchJson(`${API_BASE}/exams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examData) }),

  deleteExam: (examId) => fetchJson(`${API_BASE}/exams/${examId}`, { method: 'DELETE' }),

  // This is the one you should use for student submissions!
  createSubmission: (payload) => 
    fetchJson(`${API_BASE}/submissions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }),

  getSubmissions: (examId) => {
    const q = examId ? `?examId=${examId}` : '';
    return fetchJson(`${API_BASE}/submissions${q}`);
  },

  // Matches server.js: app.post('/api/submissions/:id/grade')
  gradeSubmission: (submissionId, gradeData) => {
    return fetchJson(`${API_BASE}/submissions/${submissionId}/grade`, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      }, 
      body: JSON.stringify(gradeData) 
    });
  }
};

export default apiService;