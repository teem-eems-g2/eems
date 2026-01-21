import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { useNavigate, Link } from 'react-router-dom';
import './ExamList.css';

function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Start with localStorage exams as default
    const savedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    setExams(savedExams);
    
    // Try to load exams from backend, but only use if it has data
    apiService.getExams().then(res => {
      if (res && res.success && res.exams && res.exams.length > 0) {
        // Only use backend data if it actually has exams
        setExams(res.exams);
        localStorage.setItem('allExams', JSON.stringify(res.exams));
      }
      // If backend returns empty, keep local exams
    }).catch(() => {
      // Keep local exams on error
    }).finally(() => setLoading(false));
  }, []);

  const handleStartExam = (exam) => {
    localStorage.setItem('currentExam', JSON.stringify(exam));
    navigate(`/exam/${exam.id}`);
  };

  if (loading) {
    return <div className="loading">Loading available exams...</div>;
  }

  return (
    <div className="exam-list-container">
      <div className="exam-list-header">
        <h2>Available Exams</h2>
        <Link to="/submissions" className="view-submissions-link">
          📝 View My Submissions
        </Link>
      </div>
      {exams.length === 0 ? (
        <p>No exams available at the moment. Please check back later.</p>
      ) : (
        <div className="exams-grid">
          {exams.map(exam => (
            <div key={exam.id} className="exam-card">
              <h3>{exam.title}</h3>
              <p>Questions: {exam.questions?.length || 0}</p>
              <p>Duration: {exam.duration} minutes</p>
              <p>Total Marks: {exam.totalMarks || 'N/A'}</p>
              <button 
                className="start-exam-btn"
                onClick={() => handleStartExam(exam)}
              >
                Start Exam
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExamList;
