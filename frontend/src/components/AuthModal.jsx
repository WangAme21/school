import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await axios.post(`${API_URL}/api/auth/register`, { username, password });
        alert("Registration successful! You can now log in.");
        setIsRegister(false);
      } else {
        const response = await axios.post(`${API_URL}/api/auth/login`, { username, password });
        onLoginSuccess(response.data.token, response.data.username);
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Authentication failed. Make sure your local backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isRegister ? 'Register Owner' : 'Owner Login'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-control" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>
        
        <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
          <p style={{color: 'var(--primary-color)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have an account? Login here" : "Don't have an owner account? Register here"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
