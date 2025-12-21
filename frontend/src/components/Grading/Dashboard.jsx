import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('exams');
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [exams, setExams] = useState([]);

  // Load user and existing exams on start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setExams(savedExams);
  }, []);

  // Reset questions when switching to create tab
  useEffect(() => {
    if (activeTab === 'create') {
      setQuestions([]);
      setExamTitle("");
      setDuration(45);
    }
  }, [activeTab]);

  // Add question function (Fixed with window. prefix for ESLint)
  const addQuestion = (type) => {
    let newQuestion;
    const questionId = Date.now();

    switch (type) {
      case 'mcq':
        newQuestion = {
          id: questionId,
          type: 'mcq',
          text: window.prompt("Enter MCQ question:", "What is the capital of France?") || "New MCQ Question",
          options: (window.prompt("Enter options (comma separated):", "London,Berlin,Paris,Madrid") || "").split(",") || ["Option A", "Option B", "Option C", "Option D"],
          correct: window.prompt("Enter correct option:", "Paris") || "Option A",
          marks: parseInt(window.prompt("Enter marks:", "1")) || 1
        };
        break;
      case 'truefalse':
        newQuestion = {
          id: questionId,
          type: 'truefalse',
          text: window.prompt("Enter True/False statement:", "JS is awesome.") || "New Statement",
          correct: window.confirm("Is this statement TRUE? (OK=True, Cancel=False)"),
          marks: parseInt(window.prompt("Enter marks:", "1")) || 1
        };
        break;
      case 'short':
        newQuestion = {
          id: questionId,
          type: 'short',
          text: window.prompt("Enter Short Answer question:") || "New Short Answer Question",
          marks: parseInt(window.prompt("Enter marks:", "5")) || 5
        };
        break;
      case 'numeric':
        newQuestion = {
          id: questionId,
          type: 'numeric',
          text: window.prompt("Enter Numeric question:") || "New Numeric Question",
          correct: parseInt(window.prompt("Enter correct answer:", "0")) || 0,
          marks: parseInt(window.prompt("Enter marks:", "2")) || 2
        };
        break;
      default:
        return;
    }

    setQuestions(prev => {
      const updated = [...prev, newQuestion];
      window.alert(`Added ${type} question!`);
      return updated;
    });
  };

  const handleCreateExam = () => {
    if (questions.length === 0) {
      window.alert("Please add at least one question!");
      return;
    }

    const examData = {
      id: Date.now(),
      title: examTitle || "Untitled Exam",
      duration: parseInt(duration) || 45,
      totalMarks: questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
      questions: questions,
      createdBy: user?.email || "Guest",
      createdAt: new Date().toISOString()
    };

    // Save to allExams list and currentExam for student
    const updatedExams = [...exams, examData];
    setExams(updatedExams);
    localStorage.setItem('allExams', JSON.stringify(updatedExams));
    localStorage.setItem('currentExam', JSON.stringify(examData));

    window.alert(`✅ Exam "${examData.title}" created successfully! Switching to student view...`);

    // Logout and redirect
    localStorage.setItem('user', JSON.stringify({ email: 'student@test.com', role: 'student' }));
    window.location.href = '/student';
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      const updated = exams.filter(e => e.id !== id);
      setExams(updated);
      localStorage.setItem('allExams', JSON.stringify(updated));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) return <div className="no-user">Please log in first</div>;

  return (
    <div className="dashboard-container">
      {/* SIDEBAR SECTION */}
      <div className="sidebar">
        <div className="user-info">
          <h3>👤 {user.email}</h3>
          <p className="role-badge">{user.role.toUpperCase()}</p>
        </div>

        <nav className="nav-menu">
          <button className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}>📚 My Exams</button>
          <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>➕ Create Exam</button>
          <button className={activeTab === 'grading' ? 'active' : ''} onClick={() => setActiveTab('grading')}>📝 Grading</button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>📊 Reports</button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* MAIN CONTENT SECTION */}
      <div className="main-content">
        <header className="dashboard-header">
          <h1>EEMS Dashboard</h1>
          <p>Welcome back, {user.role}!</p>
        </header>

        {/* TABS CONTENT */}
        {activeTab === 'exams' && (
          <div className="exams-section">
            <h2>My Exams</h2>
            <div className="exams-grid">
              {exams.length === 0 ? <p>No exams created yet.</p> : exams.map(exam => (
                <div key={exam.id} className="exam-card">
                  <h3>{exam.title}</h3>
                  <p>Questions: {exam.questions.length}</p>
                  <p>Total Marks: {exam.totalMarks}</p>
                  <div className="exam-actions">
                    <button className="action-btn delete" onClick={() => handleDelete(exam.id)}>Delete</button>
                  </div>
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
                <input type="number" placeholder="Total Marks" value={questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0)} readOnly />
              </div>

              <div className="question-types">
                <button type="button" onClick={() => addQuestion('mcq')}>Add MCQ</button>
                <button type="button" onClick={() => addQuestion('truefalse')}>Add True/False</button>
                <button type="button" onClick={() => addQuestion('short')}>Add Short Answer</button>
                <button type="button" onClick={() => addQuestion('numeric')}>Add Numeric</button>
              </div>

              {/* INSTRUCTOR REVIEW AREA */}
              {questions.length > 0 && (
                <div className="added-questions">
                  <h4>Questions Added ({questions.length})</h4>
                  {questions.map((q, index) => (
                    <div key={q.id} className="question-preview">
                      <strong>Q{index + 1}:</strong> {q.text} 
                      <button className="btn-small-del" onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}>x</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="publish-btn" onClick={handleCreateExam}>Publish Exam</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'grading' && (
          <div className="grading-section">
            <h2>Manual Grading</h2>
            <div className="submission-card">
              <h4>Student: John Doe</h4>
              <p>Answer: "An object stays at rest..."</p>
              <input type="number" placeholder="Marks" />
              <button className="grade-btn">Save Grade</button>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Reports & Analytics</h2>
            <div className="report-card">
              <h3>📈 Performance</h3>
              <p>Average Score: 78%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;