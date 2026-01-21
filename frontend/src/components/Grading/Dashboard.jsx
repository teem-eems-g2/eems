import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
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
  const [publishing, setPublishing] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [modalSubmission, setModalSubmission] = useState(null);

  // Load user and existing exams on start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedExams = JSON.parse(localStorage.getItem('allExams') || '[]');
    
    // Start with local exams as default
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
    });

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

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

// 1. Create a refresh toggle
const [refreshTick, setRefreshTick] = useState(0);
const [isRefreshing, setIsRefreshing] = useState(false);
const [lastUpdate, setLastUpdate] = useState(new Date());

// Auto-refresh mechanism for new submissions
useEffect(() => {
  const interval = setInterval(() => {
    // Check for new submissions every 30 seconds when on reports tab
    if (activeTab === 'reports') {
      setRefreshTick(prev => prev + 1);
    }
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [activeTab]);

// Listen for storage events (when new submission is added from another tab)
useEffect(() => {
  const handleStorageChange = (e) => {
    if (e.key && e.key.startsWith('lastSubmission_')) {
      // New submission was created, refresh reports
      setRefreshTick(prev => prev + 1);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);

// 2. Modified useEffect
useEffect(() => {
  const loadSubmissions = async () => {
    setIsRefreshing(true);
    try {
      const res = await apiService.getSubmissions();
      if (res?.success) {
        setSubmissions(res.submissions || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Runs on mount, when tab changes to grading, reports, OR when we manually trigger refresh
  if (activeTab === 'grading' || activeTab === 'dashboard' || activeTab === 'reports') {
    loadSubmissions();
  }
}, [activeTab, refreshTick]); // Add refreshTick here

// 3. Updated View Function
const viewSubmissionsForExam = (examId) => {
  setSelectedExamId(examId);
  setActiveTab('grading');
  // Instead of fetching again, we just filter the existing state in the UI
  // or trigger a specific refresh
  setRefreshTick(prev => prev + 1); 
};

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
    
    // Send new exams to backend so students can fetch them
    if (!editMode) {
      setPublishing(true);
      apiService.createExam(examData).then(res => {
        if (res && res.success && res.exam) {
          // Refresh exams from server to keep canonical list
          return apiService.getExams().then(r2 => {
            if (r2 && r2.success && r2.exams && r2.exams.length > 0) {
              setExams(r2.exams);
              localStorage.setItem('allExams', JSON.stringify(r2.exams));
            }
            // If server returns empty, keep local exams
          }).catch(() => {});
        }
      }).catch(() => {
        // ignore — local copy remains as fallback
      }).finally(() => setPublishing(false));
    }
  };

  const handleCreateExam = saveExam;
  const handleUpdateExam = saveExam;

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    const prevExams = [...exams];
    const updated = exams.filter(e => e.id !== id);
    // optimistic UI update
    setExams(updated);
    localStorage.setItem('allExams', JSON.stringify(updated));

    // delete on backend
    apiService.deleteExam(id).then(res => {
      if (!res || !res.success) {
        // revert
        setExams(prevExams);
        localStorage.setItem('allExams', JSON.stringify(prevExams));
        window.alert(res?.message || 'Failed to delete exam on server');
      }
    }).catch(err => {
      console.error('Delete failed', err);
      setExams(prevExams);
      localStorage.setItem('allExams', JSON.stringify(prevExams));
      window.alert('Failed to delete exam (network error)');
    });
  };

  const handleLogout = () => {
    // Clear only user-specific data from localStorage
    localStorage.removeItem('user');
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

  const handleManualGrade = (submissionId, questionId, awarded) => {
    console.log(`Manual grade attempt: submission ${submissionId}, question ${questionId}, awarded ${awarded}`);
    console.log('Submission ID type:', typeof submissionId);
    console.log('Question ID type:', typeof questionId);
    
    // Check if we have the token
    const token = localStorage.getItem('token');
    console.log('Auth token available:', !!token);
    
    // Find the submission to verify it exists
    const submission = submissions.find(s => s.id === submissionId);
    console.log('Found submission in frontend:', submission ? 'YES' : 'NO');
    if (submission) {
      console.log('Submission details:', { id: submission.id, name: submission.studentName, exam: submission.examTitle });
    }
    
    apiService.gradeSubmission(submissionId, { questionId, awarded }).then(res => {
      console.log('Grade submission response:', res);
      if (res && res.success && res.submission) {
        console.log('Manual grade saved successfully:', res.submission);
        setSubmissions(prev => prev.map(s => s.id === res.submission.id ? res.submission : s));
        
        // Show success feedback
        const inputElement = document.getElementById(`award_${submissionId}_${questionId}`);
        if (inputElement) {
          inputElement.style.borderColor = '#28a745';
          setTimeout(() => {
            inputElement.style.borderColor = '#ddd';
          }, 2000);
        }
      } else {
        console.error('Failed to save manual grade - Response:', res);
        alert(`Failed to save grade: ${res?.message || 'Unknown error'}`);
      }
    }).catch(err => {
      console.error('Error saving manual grade:', err);
      console.error('Error details:', err.message, err.stack);
      alert(`Error saving grade: ${err.message || 'Network error'}`);
    });
  };

  const needsManualGrading = (submission) => {
    return submission.perQuestion.some(q => !q.autoGraded);
  };

  const getManualGradingCount = (submission) => {
    return submission.perQuestion.filter(q => !q.autoGraded).length;
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
              {exams.length === 0 ? <p>No exams created yet.</p> : exams.map(exam => {
                const examSubmissions = submissions.filter(s => s.examId === exam.id);
                const submissionCount = examSubmissions.length;
                return (
                <div key={exam.id} className="exam-card">
                  <h3>{exam.title}</h3>
                  <p>Questions: {exam.questions.length}</p>
                  <p>Total Marks: {exam.totalMarks}</p>
                  <p>Submissions: {submissionCount} student{submissionCount !== 1 ? 's' : ''}</p>
                  
                  {/* Show submissions directly in the exam card */}
                  {submissionCount > 0 && (
                    <div className="submissions-table-container">
                      <h4>Student Submissions:</h4>
                      <table className="submissions-table">
                        <thead>
                          <tr>
                            <th>Student Name</th>
                            <th>Score</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {examSubmissions.map(submission => (
                            <tr key={submission.id}>
                              <td>{submission.studentName}</td>
                              <td>{submission.awarded}/{submission.totalMarks}</td>
                              <td>{new Date(submission.createdAt).toLocaleDateString()}</td>
                              <td>
                                <button 
                                  className="view-submission-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSubmissionId(submission.id);
                                    setModalSubmission(submission);
                                    setShowModal(true);
                                  }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="exam-actions">
                    <div className="exam-actions">
                      <button className="action-btn view-submissions" onClick={(e) => { 
                        e.stopPropagation(); 
                        viewSubmissionsForExam(exam.id); 
                      }}>
                        📝 View Submissions ({submissionCount})
                      </button>
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
                );
              })}
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
            <div className="grading-controls">
              <input placeholder="Search by student or exam" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="submittedAt">Submitted</option>
                <option value="studentName">Student</option>
                <option value="awarded">Score</option>
              </select>
              <button onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}>Sort: {sortDir}</button>
              <button onClick={() => {
                console.log('Force refreshing submissions...');
                // Force refresh submissions multiple times to get latest data
                apiService.getSubmissions().then(res => {
                  if (res?.success) {
                    console.log('First refresh - submissions:', res.submissions);
                    
                    // Fix missing IDs by assigning them manually if needed
                    const fixedSubmissions = res.submissions.map((sub, index) => {
                      if (!sub.id) {
                        console.log(`Fixing missing ID for ${sub.studentName}, assigning ID: ${index + 1}`);
                        return { ...sub, id: index + 1 };
                      }
                      return sub;
                    });
                    
                    console.log('Fixed submissions with IDs:', fixedSubmissions);
                    setSubmissions(fixedSubmissions);
                    
                    // Try a second time after a short delay
                    setTimeout(() => {
                      apiService.getSubmissions().then(res2 => {
                        if (res2?.success) {
                          const fixedSubmissions2 = res2.submissions.map((sub, index) => {
                            if (!sub.id) {
                              return { ...sub, id: index + 1 };
                            }
                            return sub;
                          });
                          console.log('Second refresh - submissions:', fixedSubmissions2);
                          setSubmissions(fixedSubmissions2);
                          alert('Submissions refreshed and IDs fixed! Check console for details.');
                        }
                      });
                    }, 500);
                  } else {
                    alert('Failed to refresh submissions');
                  }
                }).catch(err => {
                  console.error('Refresh error:', err);
                  alert('Error refreshing submissions');
                });
              }}>🔄 Refresh</button>
              <button onClick={() => {
                console.log('=== DEBUG: Comparing Frontend vs Backend ===');
                console.log('Frontend submissions:', submissions);
                
                // Test each submission ID by trying to grade it
                submissions.forEach((sub, index) => {
                  console.log(`Testing submission ${index + 1}:`, {
                    id: sub.id,
                    name: sub.studentName,
                    idType: typeof sub.id
                  });
                  
                  // Try a test grade call
                  apiService.gradeSubmission(sub.id, { questionId: sub.perQuestion[0]?.questionId, awarded: 1 }).then(res => {
                    console.log(`Test result for ${sub.studentName} (ID: ${sub.id}):`, res?.success ? 'SUCCESS' : res?.message || 'FAILED');
                  }).catch(err => {
                    console.log(`Test error for ${sub.studentName} (ID: ${sub.id}):`, err.message);
                  });
                });
              }}>🐛 Debug IDs</button>
              <button onClick={() => {
                // Export CSV
                const rows = (submissions || []).map(s => ({
                  id: s.id,
                  studentName: s.studentName,
                  examTitle: s.examTitle,
                  awarded: s.awarded,
                  totalMarks: s.totalMarks,
                  submittedAt: s.metadata?.startedAt || '' ,
                  tabSwitchCount: s.metadata?.tabSwitchCount || 0
                }));
                const csv = [Object.keys(rows[0] || {}).join(',')].concat(rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'submissions.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}>Export CSV</button>
            </div>

            <div className="grading-layout">
              <div className="submissions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>Manual Grading</th>
                      <th>Submitted</th>
                      <th>Tabs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions && submissions
                      .filter(s => {
                        if (!filterText) return true;
                        const q = filterText.toLowerCase();
                        return (s.studentName || '').toLowerCase().includes(q) || (s.examTitle || '').toLowerCase().includes(q);
                      })
                      .sort((a,b) => {
                        const dir = sortDir === 'asc' ? 1 : -1;
                        if (sortKey === 'awarded') return ( (a.awarded||0) - (b.awarded||0) ) * dir;
                        if (sortKey === 'studentName') return ((a.studentName||'').localeCompare(b.studentName||'')) * dir;
                        // submittedAt
                        return ((new Date(a.metadata?.startedAt||0)) - (new Date(b.metadata?.startedAt||0))) * dir;
                      })
                      .map(s => {
                        const manualCount = getManualGradingCount(s);
                        const needsManual = needsManualGrading(s);
                        return (
                        <tr key={s.id} className={`${selectedSubmissionId === s.id ? 'selected' : ''} ${needsManual ? 'needs-grading' : ''}`} onClick={() => { 
                            console.log('=== ROW CLICK DEBUG ===');
                            console.log('Clicked row for:', s.studentName);
                            console.log('Submission object:', s);
                            console.log('Submission ID:', s.id);
                            console.log('Submission ID type:', typeof s.id);
                            console.log('Setting selectedSubmissionId to:', s.id);
                            setSelectedSubmissionId(s.id); 
                            setModalSubmission(s); 
                            console.log('After setSelectedSubmissionId call');
                            console.log('========================');
                          }}>
                          <td>{s.studentName}</td>
                          <td>{s.examTitle}</td>
                          <td>{s.awarded}/{s.totalMarks}</td>
                          <td>
                            {needsManual ? (
                              <span className="manual-grading-badge">
                                📝 {manualCount} question{manualCount !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="auto-graded-badge">
                                ✅ Auto-graded
                              </span>
                            )}
                          </td>
                          <td>{s.metadata?.startedAt || '—'}</td>
                          <td>{s.metadata?.tabSwitchCount || 0}</td>
                          <td>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setModalSubmission(s); 
                                setShowModal(true);
                                console.log(`View details for ${s.studentName} - ${s.examTitle}`);
                              }}
                              style={{
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'background-color 0.3s'
                              }}
                              onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                              onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                            >
                              👁️ View Details
                            </button>
                          </td>
                        </tr>
                      )})}
                  </tbody>
                </table>
              </div>

              <div className="submission-detail" style={{background: 'white', padding: '18px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', minHeight: '200px'}}>
                {selectedSubmissionId ? (
                  (() => {
                    console.log('=== SUBMISSION SELECTION DEBUG ===');
                    console.log('selectedSubmissionId:', selectedSubmissionId);
                    console.log('submissions data:', submissions);
                    console.log('submissions length:', submissions.length);
                    
                    const submission = submissions.find(s => s.id === selectedSubmissionId);
                    console.log('Found submission:', submission);
                    console.log('Available IDs:', submissions.map(s => ({ id: s.id, name: s.studentName })));
                    console.log('=====================================');
                    
                    if (!submission) {
                      return (
                        <div>
                          <p>Submission not found.</p>
                          <button onClick={() => {
                            console.log('Refreshing submissions...');
                            apiService.getSubmissions().then(res => {
                              if (res?.success) {
                                console.log('Refreshed submissions:', res.submissions);
                                setSubmissions(res.submissions || []);
                              }
                            });
                          }}>Refresh Submissions</button>
                        </div>
                      );
                    }

                    return (
                      <div>
                        <h4>{submission.studentName} — {submission.examTitle}</h4>
                        <p><strong>Total:</strong> {submission.awarded} / {submission.totalMarks}</p>
                        {needsManualGrading(submission) && (
                          <div className="manual-grading-alert">
                            <p>📝 <strong>{getManualGradingCount(submission)} question{getManualGradingCount(submission) !== 1 ? 's' : ''}</strong> need manual grading</p>
                          </div>
                        )}
                        {submission.metadata && (
                          <div className="submission-metadata">
                            <p><strong>Started:</strong> {submission.metadata.startedAt}</p>
                            <p><strong>Ended:</strong> {submission.metadata.endedAt}</p>
                            <p><strong>Tab switches:</strong> {submission.metadata.tabSwitchCount || 0}</p>
                          </div>
                        )}
                        <div className="per-questions">
                          {submission.perQuestion.map((q, idx) => (
                            <div key={idx} className={`per-question ${!q.autoGraded ? 'needs-manual-grading' : ''}`}>
                              <div className="question-header">
                                <p><strong>Q{idx + 1}:</strong> {q.questionText} {!q.autoGraded && <span className="manual-indicator">📝 Manual Grading Needed</span>}</p>
                              </div>
                              <p><strong>Answer:</strong> {String(q.studentAnswer)}</p>
                              <p><strong>Correct:</strong> {String(q.correctAnswer)}</p>
                              <p><strong>Marks:</strong> {q.awarded} / {q.marks}</p>
                              <p><strong>Time spent:</strong> {submission.metadata?.perQuestionTimes?.[q.questionId] ?? 'N/A'}s</p>
                              <div className="manual-grade-controls">
                                <label>Adjust awarded:</label>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max={q.marks} 
                                  defaultValue={q.awarded} 
                                  id={`award_${submission.id}_${q.questionId}`} 
                                  style={{
                                    width: '80px', 
                                    padding: '8px', 
                                    marginRight: '10px',
                                    border: '2px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                  }}
                                />
                                <button 
                                  onClick={() => {
                                    const val = Number(document.getElementById(`award_${submission.id}_${q.questionId}`).value || 0);
                                    console.log(`Saving grade for ${submission.studentName}, question ${idx + 1}: ${val}/${q.marks}`);
                                    handleManualGrade(submission.id, q.questionId, val);
                                  }}
                                  style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    transition: 'background-color 0.3s'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                                >
                                  💾 Save
                                </button>
                                <span style={{marginLeft: '10px', fontSize: '12px', color: '#666'}}>
                                  {q.awarded}/{q.marks} marks
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p>Select a submission to view details and grade.</p>
                )}
              </div>
            </div>

            {showModal && modalSubmission && (
              <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px 8px 0 0'}}>
                    <h3 style={{margin: 0, color: '#333'}}>
                      📋 {modalSubmission.studentName} — {modalSubmission.examTitle}
                    </h3>
                    <div className="modal-header-actions" style={{display: 'flex', gap: '10px'}}>
                      <span style={{
                        background: modalSubmission.awarded === modalSubmission.totalMarks ? '#28a745' : '#ffc107',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {modalSubmission.awarded === modalSubmission.totalMarks ? '✅ Complete' : '⚠️ Incomplete'}
                      </span>
                      <button 
                        onClick={() => {
                          console.log(`Exporting details for ${modalSubmission.studentName}`);
                          alert(`Export functionality coming soon for ${modalSubmission.studentName}'s submission!`);
                        }}
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        📥 Export
                      </button>
                    </div>
                  </div>
                  <p><strong>Score:</strong> {modalSubmission.awarded}/{modalSubmission.totalMarks}</p>
                  <p><strong>Submitted:</strong> {new Date(modalSubmission.createdAt).toLocaleString()}</p>
                  <p><strong>Tab Switches:</strong> {modalSubmission.metadata?.tabSwitchCount || 0}</p>
                  
                  <div className="question-details">
                    <h4>Question-by-Question Details:</h4>
                    {modalSubmission.perQuestion?.map((question, index) => (
                      <div key={question.questionId} className={`question-detail-item ${!question.autoGraded ? 'needs-manual-grading' : ''}`}>
                        <div className="question-header">
                          <strong>Question {index + 1}:</strong> {question.questionText}
                          {!question.autoGraded && <span className="manual-indicator">📝 Manual Grading Needed</span>}
                        </div>
                        <div className="question-info">
                          <p><strong>Type:</strong> {question.type}</p>
                          <p><strong>Student Answer:</strong> {String(question.studentAnswer)}</p>
                          <p><strong>Correct Answer:</strong> {String(question.correctAnswer)}</p>
                          <p><strong>Marks:</strong> {question.awarded}/{question.marks}</p>
                          <p><strong>Time Spent:</strong> {modalSubmission.metadata?.perQuestionTimes?.[question.questionId] || 0} seconds</p>
                          <p><strong>Auto-graded:</strong> {question.autoGraded ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="grade-input">
                          <label><strong>Adjust Score:</strong></label>
                          <input 
                            type="number" 
                            min="0" 
                            max={question.marks}
                            defaultValue={question.awarded}
                            onChange={(e) => {
                              const newScore = parseInt(e.target.value) || 0;
                              question.awarded = newScore;
                              // Update total score
                              modalSubmission.awarded = modalSubmission.perQuestion.reduce((sum, q) => sum + (q.awarded || 0), 0);
                            }}
                          />
                          <span> / {question.marks}</span>
                        </div>
                        <div className="feedback-input">
                          <label><strong>Feedback:</strong></label>
                          <textarea 
                            placeholder="Add feedback for this question..."
                            defaultValue={question.feedback || ''}
                            onChange={(e) => {
                              question.feedback = e.target.value;
                            }}
                            rows="2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="modal-actions" style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px'}}>
                    <button 
                      onClick={() => {
                        console.log(`Printing details for ${modalSubmission.studentName}`);
                        alert(`Print functionality coming soon for ${modalSubmission.studentName}'s submission!`);
                      }}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🖨️ Print
                    </button>
                    <button 
                      onClick={() => setShowModal(false)}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ❌ Close
                    </button>
                    <button 
                      className="save-grade-btn" 
                      onClick={() => {
                        // Save all grades in a single call
                        const gradeData = modalSubmission.perQuestion.map(q => ({
                          questionId: q.questionId,
                          awarded: q.awarded,
                          feedback: q.feedback || ''
                        }));
                       
                        console.log('Saving grades for submission ID:', modalSubmission.id);
                        console.log('Grade data:', gradeData);
                       
                        apiService.gradeSubmission(modalSubmission.id, gradeData).then(res => {
                          if (res && res.success) {
                            alert('✅ Grades saved successfully!');
                            setShowModal(false);
                            // Refresh submissions
                            const load = () => apiService.getSubmissions().then(res => {
                              if (res && res.success) setSubmissions(res.submissions || []);
                            }).catch(() => setSubmissions([]));
                            load();
                          } else {
                            alert('❌ Failed to save grades: ' + (res.message || 'Unknown error'));
                          }
                        }).catch(err => {
                          console.error('Detailed error saving grades:', err);
                          alert(`❌ Failed to save grades: ${err.message || 'Unknown error'}`);
                        });
                      }}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      💾 Save Grades
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="reports-header">
              <div className="reports-title">
                <h2>📊 Reports & Analytics</h2>
                <span className="last-update">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                  {isRefreshing && <span className="refreshing-indicator"> 🔄 Updating...</span>}
                </span>
              </div>
              <button 
                className={`refresh-reports-btn ${isRefreshing ? 'refreshing' : ''}`}
                onClick={() => setRefreshTick(prev => prev + 1)}
                title="Refresh Reports Data"
                disabled={isRefreshing}
              >
                {isRefreshing ? '🔄 Updating...' : '🔄 Refresh'}
              </button>
            </div>
            
            {/* Key Performance Indicators */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-content">
                  <h3>Total Students</h3>
                  <p className="kpi-value">{[...new Set(submissions.map(s => s.studentName))].length}</p>
                  <span className="kpi-label">Active learners</span>
                </div>
              </div>
              
              <div className="kpi-card">
                <div className="kpi-icon">📝</div>
                <div className="kpi-content">
                  <h3>Total Submissions</h3>
                  <p className="kpi-value">{submissions.length}</p>
                  <span className="kpi-label">Across all exams</span>
                </div>
              </div>
              
              <div className="kpi-card">
                <div className="kpi-icon">🎯</div>
                <div className="kpi-content">
                  <h3>Average Score</h3>
                  <p className="kpi-value">
                    {submissions.length > 0 
                      ? Math.round((submissions.reduce((sum, s) => sum + (s.awarded / s.totalMarks * 100), 0) / submissions.length))
                      : 0}%
                  </p>
                  <span className="kpi-label">Class performance</span>
                </div>
              </div>
              
              <div className="kpi-card">
                <div className="kpi-icon">⏱️</div>
                <div className="kpi-content">
                  <h3>Avg. Completion Time</h3>
                  <p className="kpi-value">
                    {submissions.length > 0 
                      ? Math.round(submissions.reduce((sum, s) => {
                          const start = new Date(s.metadata?.startedAt);
                          const end = new Date(s.metadata?.endedAt);
                          return sum + (end - start) / 1000;
                        }, 0) / submissions.length / 60)
                      : 0}m
                  </p>
                  <span className="kpi-label">Minutes per exam</span>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="analytics-grid">
              {/* Student Performance Table */}
              <div className="analytics-card">
                <h3>📈 Student Performance Overview</h3>
                <div className="table-container">
                  <table className="performance-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Exams Taken</th>
                        <th>Average Score</th>
                        <th>Highest Score</th>
                        <th>Total Time</th>
                        <th>Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...new Set(submissions.map(s => s.studentName))].map(studentName => {
                        const studentSubmissions = submissions.filter(s => s.studentName === studentName);
                        const avgScore = Math.round(
                          studentSubmissions.reduce((sum, s) => sum + (s.awarded / s.totalMarks * 100), 0) / studentSubmissions.length
                        );
                        const highestScore = Math.max(...studentSubmissions.map(s => (s.awarded / s.totalMarks * 100)));
                        const totalTime = studentSubmissions.reduce((sum, s) => {
                          const start = new Date(s.metadata?.startedAt);
                          const end = new Date(s.metadata?.endedAt);
                          return sum + (end - start) / 1000 / 60;
                        }, 0);
                        
                        return (
                          <tr key={studentName}>
                            <td><strong>{studentName}</strong></td>
                            <td>{studentSubmissions.length}</td>
                            <td>{avgScore}%</td>
                            <td>{Math.round(highestScore)}%</td>
                            <td>{Math.round(totalTime)}m</td>
                            <td>
                              <div className="performance-bar">
                                <div 
                                  className="performance-fill" 
                                  style={{ 
                                    width: `${avgScore}%`,
                                    backgroundColor: avgScore >= 80 ? '#28a745' : avgScore >= 60 ? '#ffc107' : '#dc3545'
                                  }}
                                ></div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exam Statistics */}
              <div className="analytics-card">
                <h3>📋 Exam Statistics</h3>
                <div className="exam-stats-grid">
                  {[...new Set(submissions.map(s => s.examTitle))].map(examTitle => {
                    const examSubmissions = submissions.filter(s => s.examTitle === examTitle);
                    const avgScore = Math.round(
                      examSubmissions.reduce((sum, s) => sum + (s.awarded / s.totalMarks * 100), 0) / examSubmissions.length
                    );
                    const passRate = Math.round(
                      (examSubmissions.filter(s => (s.awarded / s.totalMarks * 100) >= 60).length / examSubmissions.length) * 100
                    );
                    
                    return (
                      <div key={examTitle} className="exam-stat-card">
                        <h4>{examTitle}</h4>
                        <div className="stat-row">
                          <span>Submissions:</span>
                          <strong>{examSubmissions.length}</strong>
                        </div>
                        <div className="stat-row">
                          <span>Average Score:</span>
                          <strong>{avgScore}%</strong>
                        </div>
                        <div className="stat-row">
                          <span>Pass Rate:</span>
                          <strong>{passRate}%</strong>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${avgScore}%`,
                              backgroundColor: avgScore >= 70 ? '#28a745' : avgScore >= 50 ? '#ffc107' : '#dc3545'
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Question Analysis */}
              <div className="analytics-card">
                <h3>🔍 Question Difficulty Analysis</h3>
                <div className="question-analysis">
                  {(() => {
                    const questionStats = {};
                    submissions.forEach(submission => {
                      submission.perQuestion.forEach(q => {
                        const key = `${q.questionText.substring(0, 30)}...`;
                        if (!questionStats[key]) {
                          questionStats[key] = {
                            totalAttempts: 0,
                            correctAnswers: 0,
                            totalMarks: 0,
                            awardedMarks: 0,
                            type: q.type
                          };
                        }
                        questionStats[key].totalAttempts++;
                        questionStats[key].totalMarks += q.marks;
                        questionStats[key].awardedMarks += q.awarded;
                        if (q.awarded === q.marks) {
                          questionStats[key].correctAnswers++;
                        }
                      });
                    });

                    return Object.entries(questionStats).map(([question, stats]) => {
                      const successRate = Math.round((stats.correctAnswers / stats.totalAttempts) * 100);
                      const avgScore = Math.round((stats.awardedMarks / stats.totalMarks) * 100);
                      
                      return (
                        <div key={question} className="question-stat">
                          <div className="question-header">
                            <span className="question-type">{stats.type.toUpperCase()}</span>
                            <span className="question-text">{question}</span>
                          </div>
                          <div className="question-metrics">
                            <div className="metric">
                              <span>Success Rate:</span>
                              <strong>{successRate}%</strong>
                            </div>
                            <div className="metric">
                              <span>Avg Score:</span>
                              <strong>{avgScore}%</strong>
                            </div>
                            <div className="metric">
                              <span>Attempts:</span>
                              <strong>{stats.totalAttempts}</strong>
                            </div>
                          </div>
                          <div className="difficulty-bar">
                            <div 
                              className="difficulty-fill" 
                              style={{ 
                                width: `${successRate}%`,
                                backgroundColor: successRate >= 70 ? '#28a745' : successRate >= 40 ? '#ffc107' : '#dc3545'
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Time Analytics */}
              <div className="analytics-card">
                <h3>⏰ Time Analytics</h3>
                <div className="time-stats">
                  <div className="time-stat-item">
                    <h4>Peak Submission Times</h4>
                    {(() => {
                      const hourCounts = {};
                      submissions.forEach(s => {
                        const hour = new Date(s.createdAt).getHours();
                        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                      });
                      
                      return Object.entries(hourCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([hour, count]) => (
                          <div key={hour} className="peak-time">
                            <span>{hour}:00 - {parseInt(hour) + 1}:00</span>
                            <strong>{count} submissions</strong>
                          </div>
                        ));
                    })()}
                  </div>
                  
                  <div className="time-stat-item">
                    <h4>Average Time per Question Type</h4>
                    {(() => {
                      const typeTimes = {};
                      submissions.forEach(submission => {
                        submission.perQuestion.forEach(q => {
                          const time = submission.metadata?.perQuestionTimes?.[q.questionId] || 0;
                          if (!typeTimes[q.type]) {
                            typeTimes[q.type] = { totalTime: 0, count: 0 };
                          }
                          typeTimes[q.type].totalTime += time;
                          typeTimes[q.type].count++;
                        });
                      });
                      
                      return Object.entries(typeTimes).map(([type, data]) => (
                        <div key={type} className="type-time">
                          <span>{type.toUpperCase()}:</span>
                          <strong>{Math.round(data.totalTime / data.count)}s</strong>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Integrity Metrics */}
              <div className="analytics-card">
                <h3>🛡️ Academic Integrity Metrics</h3>
                <div className="integrity-stats">
                  <div className="integrity-metric">
                    <div className="integrity-icon">👁️</div>
                    <div className="integrity-content">
                      <h4>Tab Switch Detection</h4>
                      <p>{submissions.filter(s => (s.metadata?.tabSwitchCount || 0) > 0).length} students switched tabs</p>
                      <div className="tab-switch-details">
                        {submissions.filter(s => (s.metadata?.tabSwitchCount || 0) > 0).map(s => (
                          <div key={s.id} className="tab-switch-item">
                            <span>{s.studentName}</span>
                            <strong>{s.metadata?.tabSwitchCount || 0} switches</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="integrity-metric">
                    <div className="integrity-icon">🕵️</div>
                    <div className="integrity-content">
                      <h4>Window Visibility Events</h4>
                      <p>{submissions.filter(s => (s.metadata?.visibilityEvents?.length || 0) > 0).length} suspicious activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="export-section">
              <h3>📥 Export Reports</h3>
              <div className="export-buttons">
                <button 
                  onClick={() => {
                    const csvData = [
                      ['Student Name', 'Exam Title', 'Score', 'Total Marks', 'Percentage', 'Time Taken (min)', 'Tab Switches'],
                      ...submissions.map(s => [
                        s.studentName,
                        s.examTitle,
                        s.awarded,
                        s.totalMarks,
                        Math.round((s.awarded / s.totalMarks) * 100) + '%',
                        Math.round((new Date(s.metadata?.endedAt) - new Date(s.metadata?.startedAt)) / 1000 / 60),
                        s.metadata?.tabSwitchCount || 0
                      ])
                    ];
                    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'detailed_report.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="export-btn"
                >
                  📊 Export Detailed Report
                </button>
                
                <button 
                  onClick={() => {
                    const summaryData = {
                      totalStudents: [...new Set(submissions.map(s => s.studentName))].length,
                      totalSubmissions: submissions.length,
                      averageScore: Math.round((submissions.reduce((sum, s) => sum + (s.awarded / s.totalMarks * 100), 0) / submissions.length)),
                      exams: [...new Set(submissions.map(s => s.examTitle))].map(title => ({
                        title,
                        submissions: submissions.filter(s => s.examTitle === title).length,
                        averageScore: Math.round(
                          submissions.filter(s => s.examTitle === title)
                            .reduce((sum, s) => sum + (s.awarded / s.totalMarks * 100), 0) / 
                          submissions.filter(s => s.examTitle === title).length
                        )
                      }))
                    };
                    
                    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'summary_report.json';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="export-btn"
                >
                  📈 Export Summary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
