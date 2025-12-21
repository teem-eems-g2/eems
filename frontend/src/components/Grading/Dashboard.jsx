import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('exams');
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    if (savedUser) setUser(JSON.parse(savedUser));
    setExams(savedExams);
  }, []);

  // Helper to update marks in the preview list
  const updateQuestionMark = (id, newMark) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, marks: parseInt(newMark) || 0 } : q
    ));
  };

  const addQuestion = (type) => {
    let newQuestion;
    const questionId = Date.now();

    switch(type) {
      case 'mcq':
        newQuestion = {
          id: questionId,
          type: 'mcq',
          text: window.prompt("Enter MCQ question:") || "New Question",
          options: (window.prompt("Options (comma separated):") || "A,B,C,D").split(","),
          correct: window.prompt("Correct option:"),
          marks: 1
        };
        break;
      case 'truefalse':
        newQuestion = {
          id: questionId,
          type: 'truefalse',
          text: window.prompt("Enter Statement:") || "Statement",
          correct: window.confirm("Is it True?"),
          marks: 1
        };
        break;
      case 'short':
        newQuestion = {
          id: questionId,
          type: 'short',
          text: window.prompt("Enter Question:") || "Short Question",
          marks: 5
        };
        break;
      default: return;
    }
    setQuestions([...questions, newQuestion]);
  };

  const handleCreateExam = () => {
    if (questions.length === 0) {
      window.alert("Add questions first!");
      return;
    }
    
    const examData = {
      id: Date.now(),
      title: examTitle || "Untitled Exam",
      duration: parseInt(duration),
      totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
      questions: questions,
      createdBy: user?.email,
      createdAt: new Date().toISOString()
    };

    const updatedExams = [...exams, examData];
    setExams(updatedExams);
    localStorage.setItem('allExams', JSON.stringify(updatedExams));
    localStorage.setItem('currentExam', JSON.stringify(examData));
    
    window.alert("✅ Exam Published Successfully! It is now available for students.");
    // REMOVED: The window.location.href redirect so instructor stays here
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) return <div className="no-user">Please log in first</div>;

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="user-info">
          <h3>👤 {user.email}</h3>
          <p className="role-badge">{user.role.toUpperCase()}</p>
        </div>
        <nav className="nav-menu">
          <button className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>📚 My Exams</button>
          <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>➕ Create Exam</button>
          <button className={activeTab === 'grading' ? 'active' : ''} onClick={() => setActiveTab('grading')}>📝 Grading</button>
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="main-content">
        <header className="dashboard-header">
          <h1>EEMS Dashboard</h1>
          <p>Welcome back, {user.role}!</p>
        </header>

        {activeTab === 'exams' && (
          <div className="exams-section">
            <h2>My Exams</h2>
            <div className="exams-grid">
              {exams.map(exam => (
                <div key={exam.id} className="exam-card">
                  <h3>{exam.title}</h3>
                  <p>Questions: {exam.questions.length} | Marks: {exam.totalMarks}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-exam">
            <h2>Create New Exam</h2>
            <form className="exam-form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="Exam Title" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
              <div className="form-row">
                <input type="number" placeholder="Duration (mins)" value={duration} onChange={(e) => setDuration(e.target.value)} />
                <div className="total-marks-display">Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}</div>
              </div>
              
              <div className="question-types">
                <button type="button" onClick={() => addQuestion('mcq')}>Add MCQ</button>
                <button type="button" onClick={() => addQuestion('truefalse')}>Add True/False</button>
                <button type="button" onClick={() => addQuestion('short')}>Add Short Answer</button>
              </div>

              {/* PREVIEW SECTION FOR INSTRUCTOR */}
              {questions.length > 0 && (
                <div className="added-questions">
                  <h4>Exam Preview (Edit Marks/Remove)</h4>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Question</th>
                        <th>Type</th>
                        <th>Marks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((q, index) => (
                        <tr key={q.id}>
                          <td>{index + 1}</td>
                          <td>{q.text}</td>
                          <td>{q.type}</td>
                          <td>
                            <input 
                              type="number" 
                              className="edit-mark-input"
                              value={q.marks} 
                              onChange={(e) => updateQuestionMark(q.id, e.target.value)} 
                            />
                          </td>
                          <td>
                            <button className="remove-btn" onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="form-actions">
                <button type="button" className="publish-btn" onClick={handleCreateExam}>Publish Exam</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
