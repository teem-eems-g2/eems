import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import './Submissions.css';

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Get current user
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const studentName = localStorage.getItem('studentName') || 'Anonymous';
    
    // Load all submissions and filter by current student
    apiService.getSubmissions().then(res => {
      if (res && res.success) {
        const studentSubmissions = (res.submissions || []).filter(s => 
          s.studentName.toLowerCase() === studentName.toLowerCase()
        );
        setSubmissions(studentSubmissions);
      }
    }).catch(() => {
      setSubmissions([]);
    }).finally(() => setLoading(false));
  }, []);

  const viewSubmissionDetails = (submission) => {
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading your submissions...</div>;
  }

  return (
    <div className="submissions-container">
      <h2>Your Exam Submissions</h2>
      
      {submissions.length === 0 ? (
        <div className="no-submissions">
          <p>You haven't submitted any exams yet.</p>
          <p>Take an exam to see your results here!</p>
        </div>
      ) : (
        <div className="submissions-grid">
          {submissions.map(submission => (
            <div key={submission.id} className="submission-card">
              <h3>{submission.examTitle}</h3>
              <div className="submission-info">
                <p><strong>Score:</strong> {submission.awarded} / {submission.totalMarks}</p>
                <p><strong>Percentage:</strong> {Math.round((submission.awarded / submission.totalMarks) * 100)}%</p>
                <p><strong>Submitted:</strong> {new Date(submission.createdAt).toLocaleDateString()}</p>
                {submission.metadata && (
                  <div className="submission-metadata">
                    <p><strong>Time Taken:</strong> {Math.round((new Date(submission.metadata.endedAt) - new Date(submission.metadata.startedAt)) / 60000)} minutes</p>
                    <p><strong>Tab Switches:</strong> {submission.metadata.tabSwitchCount || 0}</p>
                  </div>
                )}
              </div>
              <button 
                className="view-details-btn"
                onClick={() => viewSubmissionDetails(submission)}
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedSubmission && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="submission-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedSubmission.examTitle} - Detailed Results</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="submission-summary">
              <div className="score-circle">
                <h2>{selectedSubmission.awarded} / {selectedSubmission.totalMarks}</h2>
                <p>{Math.round((selectedSubmission.awarded / selectedSubmission.totalMarks) * 100)}%</p>
              </div>
              
              {selectedSubmission.metadata && (
                <div className="metadata-info">
                  <h4>Exam Information</h4>
                  <p><strong>Started:</strong> {new Date(selectedSubmission.metadata.startedAt).toLocaleString()}</p>
                  <p><strong>Ended:</strong> {new Date(selectedSubmission.metadata.endedAt).toLocaleString()}</p>
                  <p><strong>Duration:</strong> {Math.round((new Date(selectedSubmission.metadata.endedAt) - new Date(selectedSubmission.metadata.startedAt)) / 60000)} minutes</p>
                  <p><strong>Tab Switches:</strong> {selectedSubmission.metadata.tabSwitchCount || 0}</p>
                </div>
              )}
            </div>

            <div className="questions-review">
              <h4>Question by Question Review</h4>
              {selectedSubmission.perQuestion.map((question, index) => (
                <div key={index} className={`question-review ${question.awarded > 0 ? 'correct' : 'incorrect'}`}>
                  <div className="question-header">
                    <strong>Question {index + 1}:</strong> {question.questionText}
                    <span className="question-marks">{question.awarded} / {question.marks} marks</span>
                  </div>
                  <div className="answer-comparison">
                    <p><strong>Your Answer:</strong> {String(question.studentAnswer)}</p>
                    <p><strong>Correct Answer:</strong> {String(question.correctAnswer)}</p>
                  </div>
                  {question.autoGraded && (
                    <div className="grading-info">
                      <span className="auto-graded">Auto-graded</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Submissions;
