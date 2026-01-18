// API service for communicating with backend
const API_BASE = 'http://localhost:5000/api';

export const apiService = {
  // Login user
  async login(email, password) {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // Get all exams
  async getExams() {
    const response = await fetch(`${API_BASE}/exams`);
    return response.json();
  },

  // Create new exam
  async createExam(examData) {
    const response = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData)
    });
    return response.json();
  },

  // Submit exam for auto-grading
  async submitExam(answers) {
    const response = await fetch(`${API_BASE}/grade/auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    return response.json();
  }
};

export default apiService;