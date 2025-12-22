import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExamList.css';

function ExamList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load available exams from localStorage
    const savedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    setExams(savedExams);
    setLoading(false);
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
      <h2>Available Exams</h2>
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
