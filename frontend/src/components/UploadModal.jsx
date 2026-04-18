import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UploadModal = ({ onClose, onUploadSuccess, token }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !image) {
      alert("Please provide both a title and an image.");
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', image);

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/items`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      onUploadSuccess(response.data);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to upload. Make sure the backend server and MySQL database are running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Item</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title <span style={{color: 'var(--primary-color)'}}>*</span></label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="E.g., Neo-Tokyo Scenery"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Context / Description (Discussion)</label>
            <textarea 
              className="form-control" 
              rows="8" 
              placeholder="Type your discussion or context here. You can make it as long as you want..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label>Upload Picture <span style={{color: 'var(--primary-color)'}}>*</span></label>
            <input 
              type="file" 
              accept="image/*"
              className="form-control-file" 
              onChange={e => setImage(e.target.files[0])}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '1rem'}} disabled={loading}>
            {loading ? 'Uploading...' : 'Save Portfolio Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
