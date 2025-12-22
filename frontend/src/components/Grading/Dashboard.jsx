import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const [searchParams] = useSearchParams();
  const [editMode, setEditMode] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('exams');
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState("");
  const [duration, setDuration] = useState(45);
  const [exams, setExams] = useState([]);
  const [grades, setGrades] = useState(() => {
    return JSON.parse(localStorage.getItem('grades') || '{}');
  });
  const [currentGrade, setCurrentGrade] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Load user and existing exams on start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setExams(savedExams);

    // Check for edit mode from URL
    const editExamId = searchParams.get('editExamId');
    if (editExamId) {
      const examToEdit = savedExams.find(exam => exam.id === parseInt(editExamId));
      if (examToEdit) {
        // Only update if we're not already editing this exam
        if (parseInt(editExamId) !== editingExamId) {
          setEditMode(true);
          setEditingExamId(parseInt(editExamId));
          setExamTitle(examToEdit.title);
          setDuration(examToEdit.duration);
          setQuestions([...examToEdit.questions]); // Create a new array to ensure re-render
          setActiveTab('create');
        }
      }
    }
  }, [searchParams, editingExamId]);

  // Reset form when explicitly switching to create mode (not when in edit mode)
  useEffect(() => {
    const editExamId = searchParams.get('editExamId');
    if (activeTab === 'create' && !editExamId && !editingExamId) {
      setQuestions([]);
      setExamTitle("");
      setDuration(45);
      setEditMode(false);
      setEditingExamId(null);
    }
  }, [activeTab, searchParams, editingExamId]);

  // Function to handle editing an existing question
  const handleEditQuestion = (questionId) => {
    const questionToEdit = questions.find(q => q.id === questionId);
    if (!questionToEdit) return;

    if (window.confirm('Edit this question?')) {
      // Remove the question first
      const updatedQuestions = questions.filter(q => q.id !== questionId);
      setQuestions(updatedQuestions);

      // Re-add it with the same ID
      const newQuestion = { ...questionToEdit };
      
      // Show appropriate prompt based on question type
      switch (questionToEdit.type) {
        case 'mcq':
          newQuestion.text = window.prompt("Edit MCQ question:", questionToEdit.text) || questionToEdit.text;
          newQuestion.options = (window.prompt("Edit options (comma separated):", questionToEdit.options.join(',')) || '').split(',').map(opt => opt.trim());
          newQuestion.correct = window.prompt("Edit correct option:", questionToEdit.correct) || questionToEdit.correct;
          newQuestion.marks = parseInt(window.prompt("Edit marks:", questionToEdit.marks)) || questionToEdit.marks;
          break;
        case 'truefalse':
          newQuestion.text = window.prompt("Edit True/False statement:", questionToEdit.text) || questionToEdit.text;
          newQuestion.correct = window.confirm("Is this statement TRUE? (OK=True, Cancel=False)");
          newQuestion.marks = parseInt(window.prompt("Edit marks:", questionToEdit.marks)) || questionToEdit.marks;
          break;
        case 'short':
          newQuestion.text = window.prompt("Edit Short Answer question:", questionToEdit.text) || questionToEdit.text;
          newQuestion.answer = window.prompt("Edit the expected answer:", questionToEdit.answer) || questionToEdit.answer;
          newQuestion.marks = parseInt(window.prompt("Edit marks:", questionToEdit.marks)) || questionToEdit.marks;
          break;
        case 'numeric':
          newQuestion.text = window.prompt("Edit Numeric question:", questionToEdit.text) || questionToEdit.text;
          newQuestion.correct = parseInt(window.prompt("Edit correct answer:", questionToEdit.correct)) || questionToEdit.correct;
          newQuestion.marks = parseInt(window.prompt("Edit marks:", questionToEdit.marks)) || questionToEdit.marks;
          break;
        default:
          return;
      }

      // Add the edited question back
      setQuestions([...updatedQuestions, newQuestion]);
    }
  };

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
          answer: window.prompt("Enter the expected answer:") || "Expected answer",
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

  const saveExam = () => {
    if (questions.length === 0) {
      window.alert("Please add at least one question!");
      return;
    }

    const examData = {
      id: editMode ? editingExamId : Date.now(),
      title: examTitle || "Untitled Exam",
      duration: parseInt(duration) || 45,
      totalMarks: questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
      questions: questions,
      createdBy: user?.email || "Guest",
      createdAt: editMode 
        ? exams.find(e => e.id === editingExamId)?.createdAt || new Date().toISOString()
        : new Date().toISOString()
    };

    // Update or add exam
    let updatedExams;
    if (editMode) {
      updatedExams = exams.map(exam => 
        exam.id === editingExamId ? examData : exam
      );
    } else {
      updatedExams = [...exams, examData];
    }
    
    setExams(updatedExams);
    localStorage.setItem('allExams', JSON.stringify(updatedExams));
    
    // Reset form
    setQuestions([]);
    setExamTitle("");
    setDuration(45);
    setEditMode(false);
    setEditingExamId(null);
    
    window.alert(`✅ Exam "${examData.title}" ${editMode ? 'updated' : 'created'} successfully!`);
    
    // Switch to exams tab to view the exam
    setActiveTab('exams');
  };

  const handleCreateExam = saveExam;
  const handleUpdateExam = saveExam;

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      const updated = exams.filter(e => e.id !== id);
      return;
    }
    
    const studentId = 'solomon_fentaw'; // In a real app, this would be dynamic
    const newGrades = {
      ...grades,
      [studentId]: {
        ...grades[studentId],
        'physics_question_1': {
          answer: "An object stays at rest...",
          grade: parseFloat(currentGrade),
          maxMarks: 10,
          feedback: '',
          gradedAt: new Date().toISOString()
        }
      }
    };
    
    // Save to localStorage
    localStorage.setItem('grades', JSON.stringify(newGrades));
    setGrades(newGrades);
    setSaveStatus('Grade saved successfully!');
    
    // Clear status after 3 seconds
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleLogout = () => {
    // Clear all user-related data from localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('allExams');
    localStorage.removeItem('grades');
    localStorage.removeItem('studentName');
    
    // Reset application state
    setUser(null);
    setExams([]);
    setGrades({});
    
    // Redirect to login page
    window.location.href = '/';
  };

  const handleSaveGrade = () => {
    const studentId = 'solomon_fentaw';
    const newGrades = {
      ...grades,
      [studentId]: {
        ...grades[studentId],
        'physics_question_1': {
          answer: "An object stays at rest...",
          grade: parseFloat(currentGrade),
          maxMarks: 10,
          feedback: '',
          gradedAt: new Date().toISOString()
        }
      }
    };
    
    // Save to localStorage
    localStorage.setItem('grades', JSON.stringify(newGrades));
    setGrades(newGrades);
    setSaveStatus('Grade saved successfully!');
    
    // Clear status after 3 seconds
    setTimeout(() => setSaveStatus(''), 3000);
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
          <p>Welcome, {user.role}!</p>
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
                    <div className="exam-actions">
                      <button className="action-btn edit" onClick={(e) => {
                        e.stopPropagation();
                        setEditMode(true);
                        setEditingExamId(exam.id);
                        setExamTitle(exam.title);
                        setDuration(exam.duration);
                        setQuestions([...exam.questions]); // Create a new array to ensure re-render
                        setActiveTab('create');
                      }}>Edit</button>
                      <button className="action-btn delete" onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(exam.id);
                      }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-exam">
            <div className="exam-header">
              <h2>{editMode ? 'Edit Exam' : 'Create New Exam'}</h2>
              {editMode && <span className="edit-badge">Editing Mode</span>}
            </div>
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
                      <div className="question-content">
                        <strong>Q{index + 1}:</strong> {q.text} 
                        <span className="question-marks">{q.marks} marks</span>
                      </div>
                      <div className="question-actions">
                        <button className="btn-edit" onClick={() => handleEditQuestion(q.id)}>✏️</button>
                        <button className="btn-small-del" onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this question?')) {
                            setQuestions(questions.filter(item => item.id !== q.id));
                          }
                        }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="publish-btn" 
                    onClick={editMode ? handleUpdateExam : handleCreateExam}
                  >
                    {editMode ? 'Update Exam' : 'Publish Exam'}
                  </button>
                  {editMode && (
                    <button 
                      type="button"
                      className="cancel-edit-btn"
                      onClick={() => {
                        if (window.confirm('Cancel editing? All unsaved changes will be lost.')) {
                          setEditMode(false);
                          setEditingExamId(null);
                          setActiveTab('exams');
                        }
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'grading' && (
          <div className="grading-section">
            <h2>Manual Grading</h2>
            <div className="submission-card">
              <h4>Student: Solomon Fentaw</h4>
              <p><strong>Question:</strong> An object stays at rest or in uniform motion unless acted upon by an external force. This is known as:</p>
              <p><strong>Answer:</strong> "Newton’s First Law of Motion (Law of Inertia)"</p>
              <div className="grading-controls">
                <div className="grade-input">
                  <label htmlFor="grade">Grade (out of 10):</label>
                  <input
                    type="number" 
                    id="grade"
                    min="0" 
                    max="10" 
                    step="0.5"
                    value={currentGrade}
                    onChange={(e) => {
                      setCurrentGrade(e.target.value);
                      setSaveStatus('');
                    }}
                    placeholder="Enter grade" 
                  />
                </div>
                <button 
                  className="grade-btn" 
                  onClick={handleSaveGrade}
                  disabled={!currentGrade}
                >
                  Save Grade
                </button>
              </div>
              {saveStatus && (
                <div className={`save-status ${saveStatus.includes('success') ? 'success' : 'error'}`}>
                  {saveStatus}
                </div>
              )}
              {grades.solomon_fentaw?.physics_question_1 && (
                <div className="previous-grade">
                  <p>Previously graded: <strong>{grades.solomon_fentaw.physics_question_1.grade}/{grades.solomon_fentaw.physics_question_1.maxMarks}</strong></p>
                  <p>Last updated: {new Date(grades.solomon_fentaw.physics_question_1.gradedAt).toLocaleString()}</p>
                </div>
              )}
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
