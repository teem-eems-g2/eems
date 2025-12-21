import React, { useState, useEffect } from 'react';
//import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('exams');
//const navigate = useNavigate();
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const exams = [
    { id: 1, title: 'Mathematics Final', date: '2025-12-20', status: 'Active', students: 45 },
    { id: 2, title: 'Physics Midterm', date: '2025-12-18', status: 'Graded', students: 38 },
    { id: 3, title: 'Chemistry Quiz', date: '2025-12-25', status: 'Upcoming', students: 52 }
  ];

  const handleCreateExam = () => {
    alert('Exam creation form would open here');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
    //navigate('/');
  };

  if (!user) {
    return <div className="no-user">Please log in first</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="user-info">
          <h3>👤 {user.email}</h3>
          <p className="role-badge">{user.role.toUpperCase()}</p>
          {/* <p className="role-badge">{user.role?.toUpperCase()}</p> */}
        </div>
        
        <nav className="nav-menu">
          <button 
            className={activeTab === 'exams' ? 'active' : ''}
            onClick={() => setActiveTab('exams')}
          >
            📚 My Exams
          </button>
          {/*user.role !== 'student' && ( <>*/}
          <button 
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            ➕ Create Exam
          </button>
          <button 
            className={activeTab === 'grading' ? 'active' : ''}
            onClick={() => setActiveTab('grading')}
          >
            📝 Grading
          </button>
        {/* </> ) */}
          <button 
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            📊 Reports
          </button>
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
                  <p>Date: {exam.date}</p>
                  <p>Students: {exam.students}</p>
                  <span className={`status ${exam.status.toLowerCase()}`}>
                    {exam.status}
                  </span>
                  <div className="exam-actions">
                    {exam.status === 'Active' && <button className="action-btn view">View</button>}
                    {exam.status === 'Graded' && <button className="action-btn results">Results</button>}
                    {exam.status === 'Upcoming' && <button className="action-btn edit">Edit</button>}
                    <button className="action-btn delete">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-exam">
            <h2>Create New Exam</h2>
            <form className="exam-form">
              <input type="text" placeholder="Exam Title" />
              <textarea placeholder="Instructions..." rows="3"></textarea>
              <div className="form-row">
                <input type="number" placeholder="Duration (minutes)" />
                <input type="datetime-local" />
                <input type="number" placeholder="Total Marks" />
                </div>
              
              <div className="question-types">
                <button type="button">Add MCQ</button>
                <button type="button">Add True/False</button>
                <button type="button">Add Short Answer</button>
                <button type="button">Add Numeric</button>
              </div>
              
              <div className="form-actions">
                <button type="button" className="preview-btn">Preview</button>
                <button type="button" className="save-btn">Save Draft</button>
                <button type="button" className="publish-btn" onClick={handleCreateExam}>
                  Publish Exam
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'grading' && (
          <div className="grading-section">
            <h2>Manual Grading</h2>
            <p>Short answer submissions pending review: <strong>12</strong></p>
            <div className="grading-queue">
              <div className="submission-card">
                <h4>Student: John Doe</h4>
                <p>Question: Explain Newton's First Law</p>
                <div className="answer-box">
                  "An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force."
                </div>
                <div className="grading-controls">
                  <input type="number" min="0" max="10" placeholder="Marks" />
                  <textarea placeholder="Feedback for student..." rows="2"></textarea>
                  <button className="grade-btn">Save Grade</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Reports & Analytics</h2>
            <div className="report-cards">
              <div className="report-card">
                <h3>📈 Performance Overview</h3>
                <p>Average Score: 78%</p>
                <p>Highest: 95%</p>
                <p>Lowest: 45%</p>
              </div>
              <div className="report-card">
                <h3>📥 Export Results</h3>
                <button className="export-btn">Download CSV</button>
                <button className="export-btn">Download PDF</button>
                <button className="export-btn">View Analytics</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;