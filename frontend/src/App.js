import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Grading/Dashboard';
import ExamInterface from './components/Exam/ExamInterface';
import ExamList from './components/Exam/ExamList';
import Submissions from './components/Student/Submissions';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['instructor', 'grader', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/exams" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamList />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/submissions" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Submissions />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/exam/:examId" 
            element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'grader', 'admin']}>
                <ExamInterface />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;