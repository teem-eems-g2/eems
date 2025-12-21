import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Mock authentication
    localStorage.setItem('user', JSON.stringify({ email, role }));
    
    // Redirect based on role
    if (role === 'instructor' || role === 'grader' || role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="login-container">
      <h2>EEMS - Electronic Exam Marking System</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            placeholder="user@example.com"
          />
        </div>
        
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            placeholder="••••••••"
          />
        </div>
        
        <div className="form-group">
          <label>Role:</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="grader">Grader</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <button type="submit" className="login-btn">Login</button>
      </form>
      
      <div className="demo-credentials">
        <h4>Demo Credentials:</h4>
        <p><strong>Instructor:</strong> instructor@test.com / instructor123</p>
        <p><strong>Student:</strong> student@test.com / student123</p>
        <p><strong>Grader:</strong> grader@test.com / grader123</p>
        <p><strong>Admin:</strong> admin@test.com / admin123</p>
      </div>
    </div>
  );
}

export default Login;