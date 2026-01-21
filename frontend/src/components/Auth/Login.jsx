import React, { useState } from 'react';
import apiService from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isSignup, setIsSignup] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  // prefill remembered email
  React.useEffect(() => {
    const saved = localStorage.getItem('rememberedEmail');
    if (saved) setEmail(saved);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter both email and password');

    // Validate role matches email domain
    const getRoleFromEmail = (email) => {
      if (email.includes('instructor@test.com')) return 'instructor';
      if (email.includes('grader@test.com')) return 'grader';
      if (email.includes('admin@test.com')) return 'admin';
      return 'student';
    };

    const expectedRole = getRoleFromEmail(email);
    if (role !== expectedRole) {
      return alert(`Role mismatch! For email "${email}", you should select role: "${expectedRole}". Current selection: "${role}"`);
    }

    try {
      const data = await apiService.login(email, password);
      if (!data || !data.success) {
        console.log('Login failed - Response:', data);
        return alert(data?.message || 'Login failed');
      }
      
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('token', data.token);
      if (remember) localStorage.setItem('rememberedEmail', email); else localStorage.removeItem('rememberedEmail');
      
      // Simple role-based routing
      if (data.user.role === 'instructor' || data.user.role === 'grader' || data.user.role === 'admin') {
        console.log('Instructor/Grader/Admin login successful, going to dashboard');
        navigate('/dashboard');
      } else {
        console.log('Student login successful, going to exams');
        navigate('/exams');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed');
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

        {isSignup && (
          <div className="form-group">
            <label>Confirm Password:</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm password" />
          </div>
        )}

        <div className="form-group remember-row">
          <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember my email</label>
        </div>
        
        <button type="submit" className="login-btn">{isSignup ? 'Sign Up' : 'Login'}</button>
      </form>
      <div className="demo-credentials">
        <h4>🎓 Simple Login Access:</h4>
        <p><strong>Instructor:</strong> instructor@test.com / instructor123</p>
        <p><strong>Student:</strong> student@test.com / student123</p>
        <p><strong>Grader:</strong> grader@test.com / grader123</p>
        <p><strong>Admin:</strong> admin@test.com / admin123</p>
        <p className="note">✅ Instructors/Graders/Admins go to <strong>Dashboard</strong> | Students go to <strong>Exams</strong></p>
      </div>
      <div style={{marginTop: 12}}>
        <button onClick={() => setIsSignup(prev => !prev)} className="toggle-auth">{isSignup ? 'Have an account? Sign in' : 'Create an account'}</button>
      </div>
    </div>
  );
}

export default Login;