import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const [token, setToken] = useState(localStorage.getItem('portfolioToken') || '');
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('portfolioUsername') || '');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const getAxiosConfig = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  const handleLoginSuccess = (newToken, newUsername) => {
    setToken(newToken);
    setCurrentUsername(newUsername);
    localStorage.setItem('portfolioToken', newToken);
    localStorage.setItem('portfolioUsername', newUsername);
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUsername('');
    localStorage.removeItem('portfolioToken');
    localStorage.removeItem('portfolioUsername');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await axios.delete(`${API_URL}/api/items/${id}`, getAxiosConfig());
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete. Make sure you are authorized!');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
  };

  const saveEdit = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/api/items/${id}`, {
        title: editTitle,
        description: editDescription
      }, getAxiosConfig());
      setItems(items.map(item => item.id === id ? response.data : item));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('Failed to save edit. Make sure you are authorized!');
    }
  };

  return (
    <div className="container">
      <header>
        <h1>My <span>Portfolio</span></h1>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {token ? (
            <>
              <span style={{ color: 'var(--text-main)' }}>Welcome, {currentUsername}</span>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                + Add New Item
              </button>
              <button className="btn-cancel" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <button className="btn-primary" onClick={() => setIsAuthModalOpen(true)}>
              Owner Login
            </button>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-main)' }}>
          <h2>Your portfolio is empty.</h2>
          <p>Click "Add New Item" to insert your first picture!</p>
        </div>
      ) : (
        <div className="portfolio-grid">
          {items.map(item => (
            <div className="portfolio-card" key={item.id}>
              <img 
                src={item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`} 
                alt={item.title} 
                className="card-image" 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x220?text=Image+Not+Found' }}
              />
              <div className="card-content">
                {editingId === item.id ? (
                  <div className="edit-form">
                    <input 
                      type="text" 
                      className="form-control" 
                      style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)} 
                    />
                    <textarea 
                      className="form-control" 
                      rows="6" 
                      style={{ marginBottom: '1rem', flexGrow: 1 }}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    ></textarea>
                    <div className="card-actions">
                      <button className="btn-edit" onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="card-title">{item.title}</h3>
                    {item.description && <p className="card-desc">{item.description}</p>}
                    
                    {token && (
                      <div className="card-actions">
                        <button className="btn-edit" onClick={() => startEdit(item)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {isModalOpen && (
        <UploadModal 
          token={token}
          onClose={() => setIsModalOpen(false)} 
          onUploadSuccess={(newItem) => setItems([newItem, ...items])}
        />
      )}
    </div>
  );
}

export default App;
