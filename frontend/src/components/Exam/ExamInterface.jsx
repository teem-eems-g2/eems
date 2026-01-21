import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { useParams, useNavigate } from 'react-router-dom';
import './ExamInterface.css';

function ExamInterface() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examData, setExamData] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('studentName') || '';
  });
  const [startedAt, setStartedAt] = useState(null);
  const [endedAt, setEndedAt] = useState(null);
  const [perQuestionTimes, setPerQuestionTimes] = useState(() => {
    return JSON.parse(localStorage.getItem(`perQuestionTimes_${examId}`) || '{}');
  });
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [visibilityEvents, setVisibilityEvents] = useState([]);
  const [showNameInput, setShowNameInput] = useState(!studentName);
  const [finalScore, setFinalScore] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem('examAnswers');
    return saved ? JSON.parse(saved) : {};
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadExam = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setIsInstructor(user.role === 'instructor' || user.role === 'admin');
        
        const allExams = JSON.parse(localStorage.getItem('allExams') || '[]');
        const exam = allExams.find(exam => exam.id === parseInt(examId));
        
        if (exam) {
          setExamData(exam);
          setTimeLeft(exam.duration * 60);
          // Load saved answers for this specific exam
          const savedAnswers = JSON.parse(localStorage.getItem(`examAnswers_${examId}`) || '{}');
          setAnswers(savedAnswers);
          // mark start time and question start
          const now = Date.now();
          setStartedAt(new Date(now).toISOString());
          setQuestionStartTime(now);
        } else {
          setError('Exam not found');
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        setError('Failed to load exam. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      loadExam();
    } else {
      setLoading(false);
      setError('No exam ID provided');
    }
  }, [examId]);

  // Track visibility and focus to detect tab switches
  useEffect(() => {
    const handleVisibility = () => {
      const ev = { at: new Date().toISOString(), visibility: document.visibilityState };
      setVisibilityEvents(prev => { const next = [...prev, ev]; localStorage.setItem(`visibilityEvents_${examId}`, JSON.stringify(next)); return next; });
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount(prev => prev + 1);
      }
    };

    const handleBlur = () => setTabSwitchCount(prev => prev + 1);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [examId]);

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
    // before changing question store time for current question
    const now = Date.now();
    if (questionStartTime) {
      const elapsed = Math.round((now - questionStartTime) / 1000);
      setPerQuestionTimes(prev => {
        const next = { ...prev, [questionId]: (prev[questionId] || 0) + elapsed };
        localStorage.setItem(`perQuestionTimes_${examId}`, JSON.stringify(next));
        return next;
      });
      setQuestionStartTime(now);
    }

    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    // Save answers for this specific exam
    localStorage.setItem(`examAnswers_${examId}`, JSON.stringify(newAnswers));
  };

  const handleSubmit = () => {
    if (isSubmitted || !examData) return;

    let score = 0;
    const questions = examData.questions;
    
    questions.forEach(q => {
      // Logic for MCQ, True/False, and Numeric
      if ((q.type === 'mcq' || q.type === 'truefalse' || q.type === 'numeric') && 
          answers[q.id]?.toString().trim() === q.correct?.toString().trim()) {
        score += q.marks;
      }
      // Auto-grade short answer questions if the answer matches exactly (case-insensitive)
      if (q.type === 'short') {
        const studentAnswer = answers[q.id]?.toString().trim().toLowerCase();
        const correctAnswer = q.answer?.toString().trim().toLowerCase();
        if (studentAnswer === correctAnswer) {
          score += q.marks;
        }
      }
    });
    
    setFinalScore(score);
    setIsSubmitted(true); // Stop the timer and change view

    // finalize timing data for current question
    const now = Date.now();
    if (questionStartTime) {
      const elapsed = Math.round((now - questionStartTime) / 1000);
      setPerQuestionTimes(prev => {
        const next = { ...prev };
        // assign elapsed to current question index
        const currentQ = questions[currentQuestion];
        if (currentQ) {
          next[currentQ.id] = (next[currentQ.id] || 0) + elapsed;
        }
        localStorage.setItem(`perQuestionTimes_${examId}`, JSON.stringify(next));
        return next;
      });
    }
    setEndedAt(new Date(now).toISOString());

    // Send submission to backend for storage and any additional grading
    const payload = {
      studentName: studentName || 'Anonymous',
      examId: examData.id,
      answers,
      metadata: {
        startedAt,
        endedAt: new Date().toISOString(),
        durationSeconds: examData.duration * 60,
        perQuestionTimes: JSON.parse(localStorage.getItem(`perQuestionTimes_${examId}`) || '{}'),
        tabSwitchCount: tabSwitchCount,
        visibilityEvents: JSON.parse(localStorage.getItem(`visibilityEvents_${examId}`) || '[]')
      }
    };
    // Include the exam payload so backend can accept submissions even if it doesn't already have the exam stored
    payload.exam = examData;

    apiService.createSubmission(payload).then(res => {
      if (res && res.success && res.submission) {
        // replace local submission answers with server-rich submission if needed
        localStorage.setItem(`lastSubmission_${examId}`, JSON.stringify(res.submission));
      }
    }).catch(() => {
      // ignore; local result remains
    });

    // Clear local storage progress and student name
    localStorage.removeItem(`examAnswers_${examId}`);
    localStorage.removeItem('studentName');
    setStudentName('');
    setShowNameInput(true);
  };

  const handleLogout = () => {
    // Clear all user-related data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('examAnswers');
    localStorage.removeItem('studentName');
    
    // Force a full page reload to ensure all state is reset
    window.location.href = '/';
  };

  const handleEditExam = () => {
    if (window.confirm('You are about to edit this exam. Any unsaved changes will be lost. Continue?')) {
      navigate(`/dashboard?editExamId=${examId}`);
    }
  };

  // Show name input if not set
  if (showNameInput) {
    const handleNameSubmit = (e) => {
      e.preventDefault();
      if (studentName.trim()) {
        localStorage.setItem('studentName', studentName.trim());
        setShowNameInput(false);
      }
    };

    return (
      <div className="name-input-container">
        <h2>Welcome to the Exam</h2>
        <form onSubmit={handleNameSubmit}>
          <div className="form-group">
            <label htmlFor="studentName">Please enter your full name:</label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Your full name"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="start-exam-btn">Start Exam</button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="loading">Loading exam data...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!examData) return <div className="error">No exam data available</div>;

  // NEW: Result View after clicking Submit
  if (isSubmitted) {
    // Check if there are any short answer questions that were auto-graded
    const autoGradedShortAnswers = examData.questions
      .filter(q => q.type === 'short' && answers[q.id])
      .map(q => ({
        question: q.text,
        studentAnswer: answers[q.id],
        isCorrect: answers[q.id]?.toString().trim().toLowerCase() === q.answer?.toString().trim().toLowerCase(),
        marks: q.marks
      }));

    const hasAutoGraded = autoGradedShortAnswers.some(q => q.isCorrect);

    return (
      <div className="result-container">
        <h2>Exam Completed, {studentName}!</h2>
        <div className="score-circle">
          <h1>{finalScore} / {examData.totalMarks}</h1>
          <p>Total Marks Earned</p>
        </div>
        {hasAutoGraded && (
          <div className="auto-graded-section">
            <h3>Auto-graded Short Answers</h3>
            {autoGradedShortAnswers.map((item, index) => (
              item.isCorrect && (
                <div key={index} className="graded-answer correct">
                  <p><strong>Question:</strong> {item.question}</p>
                  <p><strong>Your Answer:</strong> {item.studentAnswer}</p>
                  <p className="result-correct">✓ Correct! +{item.marks} marks</p>
                </div>
              )
            ))}
          </div>
        )}

        {/* Server-side submission details if available */}
        {(() => {
          const serverSubmission = JSON.parse(localStorage.getItem(`lastSubmission_${examId}`) || 'null');
          if (serverSubmission) {
            return (
              <div className="submission-details">
                <h3>Submission Details</h3>
                <p><strong>Student:</strong> {serverSubmission.studentName}</p>
                <p><strong>Score:</strong> {serverSubmission.awarded} / {serverSubmission.totalMarks}</p>
                <div className="per-question-list">
                  {serverSubmission.perQuestion.map((p, idx) => (
                    <div key={idx} className={`per-question ${p.awarded > 0 ? 'correct' : 'incorrect'}`}>
                      <p><strong>Q:</strong> {p.questionText}</p>
                      <p><strong>Your answer:</strong> {String(p.studentAnswer)}</p>
                      <p><strong>Correct answer:</strong> {String(p.correctAnswer)}</p>
                      <p><strong>Awarded:</strong> {p.awarded} / {p.marks}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return (
            autoGradedShortAnswers.some(q => !q.isCorrect) && (
              <div className="manual-review-section">
                <h3>Pending Review</h3>
                <p>Some of your answers need instructor review.</p>
              </div>
            )
          );
        })()}
        
        <button className="logout-btn" onClick={handleLogout}>Logout & Exit</button>
      </div>
    );
  }

  // Standard Exam View
  const currentQ = examData.questions[currentQuestion];

  return (
    <div className="exam-container">
      <div className="exam-header">
        <div>
          <h2>{examData.title}</h2>
          {isInstructor && !isSubmitted && (
            <button 
              onClick={handleEditExam}
              className="edit-exam-btn"
              title="Edit Exam"
            >
              ✏️ Edit Exam
            </button>
          )}
        </div>
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