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
    
    // Simple validation
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    // Mock user database
    const users = {
      'student@test.com': { password: 'student123', role: 'student' },
      'instructor@test.com': { password: 'instructor123', role: 'instructor' },
      'grader@test.com': { password: 'grader123', role: 'grader' },
      'admin@test.com': { password: 'admin123', role: 'admin' }
    };
    
    // Check if user exists and password matches
    const user = users[email];
    if (!user || user.password !== password) {
      alert('Invalid email or password');
      return;
    }
    
    // Verify the selected role matches the user's actual role
    if (user.role !== role) {
      alert(`Please select the correct role (${user.role}) for this account`);
      return;
    }
    
    // Save user to localStorage
    localStorage.setItem('user', JSON.stringify({ email, role: user.role }));
    
    // Redirect based on role
    if (user.role === 'student') {
      navigate('/exams');
    } else {
      navigate('/dashboard');
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
        <p className="note">Note: Passwords are now required and must match the demo credentials.</p>
      </div>
    </div>
  );
}

export default Login;