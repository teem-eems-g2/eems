import React, { useState, useEffect } from 'react';
import './ExamInterface.css';

function ExamInterface() {
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  const questions = [
    {
      id: 1,
      type: 'mcq',
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correct: "Paris",
      marks: 1
    },
    {
      id: 2,
      type: 'truefalse',
      text: "JavaScript is a statically typed language.",
      correct: false,
      marks: 1
    },
    {
      id: 3,
      type: 'short',
      text: "Explain the concept of closure in JavaScript.",
      marks: 5
    }
  ];

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answers]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const autosave = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        console.log('Auto-saving answers...');
        localStorage.setItem('examAnswers', JSON.stringify(answers));
      }
    }, 10000);

    return () => clearInterval(autosave);
  }, [answers]);

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = () => {
    // Calculate score
    let score = 0;
    const totalPossibleMarks = questions.reduce((acc, q) => acc + q.marks, 0);
    questions.forEach(q => {
      if (q.type === 'mcq' && answers[q.id] === q.correct) score += q.marks;
      if (q.type === 'truefalse' && answers[q.id] === q.correct) score += q.marks;
    });
    
    alert(`Exam submitted! Score: ${score}/7`);
    localStorage.removeItem('examAnswers');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestion];

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h2>Mathematics Final Exam</h2>
        <div className="timer">
          ⏰ Time Remaining: <strong>{formatTime(timeLeft)}</strong>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        ></div>
      </div>

      <div className="question-container">
        <h3>Question {currentQuestion + 1} of {questions.length}</h3>
        <p className="question-text">{currentQ.text}</p>

        {currentQ.type === 'mcq' && (
          <div className="options">
            {currentQ.options.map((option, idx) => (
              <label key={idx} className="option">
                <input
                  type="radio"
                  name={`q${currentQ.id}`}
                  checked={answers[currentQ.id] === option}
                  onChange={() => handleAnswer(currentQ.id, option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {currentQ.type === 'truefalse' && (
          <div className="options">
            <label className="option">
              <input
                type="radio"
                name={`q${currentQ.id}`}
                checked={answers[currentQ.id] === true}
                onChange={() => handleAnswer(currentQ.id, true)}
              />
              <span>True</span>
            </label>
            <label className="option">
              <input
                type="radio"
                name={`q${currentQ.id}`}
                checked={answers[currentQ.id] === false}
                onChange={() => handleAnswer(currentQ.id, false)}
              />
              <span>False</span>
            </label>
          </div>
        )}
        {currentQ.type === 'short' && (
          <textarea
            className="short-answer"
            value={answers[currentQ.id] || ''}
            onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
            placeholder="Type your answer here..."
            rows={4}
          />
        )}

        <div className="navigation">
          <button 
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            ← Previous
          </button>
          
          <span>Auto-save: <span className="autosave-status">ON</span> (Every 10s)</span>
          
          {currentQuestion < questions.length - 1 ? (
            <button onClick={() => setCurrentQuestion(prev => prev + 1)}>
              Next →
            </button>
          ) : (
            <button className="submit-btn" onClick={handleSubmit}>
              ✅ Submit Exam
            </button>
          )}
        </div>
      </div>

      <div className="question-list">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            className={`q-btn ${currentQuestion === idx ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
            onClick={() => setCurrentQuestion(idx)}
          >
            Q{idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ExamInterface;