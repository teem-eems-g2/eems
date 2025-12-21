import React, { useState, useEffect } from 'react';
import './ExamInterface.css';

function ExamInterface() {
  const [examData, setExamData] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false); // NEW: Track submission status
  const [finalScore, setFinalScore] = useState(0);      // NEW: Store score for display
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem('examAnswers');
    return saved ? JSON.parse(saved) : {};
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    const savedExam = localStorage.getItem('currentExam');
    if (savedExam) {
      const parsed = JSON.parse(savedExam);
      setExamData(parsed);
      setTimeLeft(parsed.duration * 60);
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    // Stop timer if submitted or time runs out
    if (isSubmitted) return; 

    if (timeLeft <= 0 && examData) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examData, isSubmitted]);

  const handleAnswer = (questionId, answer) => {
    if (isSubmitted) return; // Prevent changing answers after submit
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;

    let score = 0;
    const questions = examData.questions;
    
    questions.forEach(q => {
      // Logic for MCQ, True/False, and Numeric
      if ((q.type === 'mcq' || q.type === 'truefalse' || q.type === 'numeric') && 
          answers[q.id]?.toString().trim() === q.correct?.toString().trim()) {
        score += q.marks;
      }
    });
    
    setFinalScore(score);
    setIsSubmitted(true); // Stop the timer and change view

    // Clear local storage progress
    localStorage.removeItem('examAnswers');
    
    // Optional: Keep user logged in until they click a "Close" button on the result screen
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!examData) return <div className="loading">No active exam found.</div>;

  // NEW: Result View after clicking Submit
  if (isSubmitted) {
    return (
      <div className="result-container">
        <h2>Exam Completed!</h2>
        <div className="score-circle">
          <h1>{finalScore} / {examData.totalMarks}</h1>
          <p>Total Marks Earned</p>
        </div>
        <p>Short answer questions will be reviewed by your instructor.</p>
        <button className="logout-btn" onClick={handleLogout}>Logout & Exit</button>
      </div>
    );
  }

  // Standard Exam View
  const currentQ = examData.questions[currentQuestion];

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h2>{examData.title}</h2>
        <div className={`timer ${timeLeft < 300 ? 'warning' : ''}`}>
          ⏰ Time Left: <strong>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</strong>
        </div>
      </div>

      <div className="question-container">
        <div className="q-header">
          <h3>Question {currentQuestion + 1} of {examData.questions.length}</h3>
          <span className="marks-tag">{currentQ.marks} Marks</span>
        </div>
        <p className="question-text">{currentQ.text}</p>

        {currentQ.type === 'mcq' && (
          <div className="options">
            {currentQ.options.map((option, idx) => (
              <label key={idx} className="option">
                <input type="radio" name="q-option" checked={answers[currentQ.id] === option} onChange={() => handleAnswer(currentQ.id, option)} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQ.type === 'truefalse' && (
          <div className="options">
            {["true", "false"].map((val) => (
              <label key={val} className="option">
                <input type="radio" name="q-option" checked={answers[currentQ.id] === (val === "true")} onChange={() => handleAnswer(currentQ.id, val === "true")} />
                <span>{val.charAt(0).toUpperCase() + val.slice(1)}</span>
              </label>
            ))}
          </div>
        )}

        {currentQ.type === 'short' && (
          <textarea className="short-answer" value={answers[currentQ.id] || ''} onChange={(e) => handleAnswer(currentQ.id, e.target.value)} placeholder="Type your answer here..." rows={6} />
        )}

        {(currentQ.type === 'numeric') && (
            <input type="number" className="numeric-input" value={answers[currentQ.id] || ''} onChange={(e) => handleAnswer(currentQ.id, e.target.value)} placeholder="Enter numeric value" />
        )}

        <div className="navigation">
          <button onClick={() => setCurrentQuestion(prev => prev - 1)} disabled={currentQuestion === 0}>← Previous</button>
          
          {currentQuestion < examData.questions.length - 1 ? (
            <button onClick={() => setCurrentQuestion(prev => prev + 1)}>Next →</button>
          ) : (
            <button className="submit-btn" onClick={() => {
              if(window.confirm("Are you sure you want to submit?")) handleSubmit();
            }}>✅ Submit Exam</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExamInterface;