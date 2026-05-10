import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const UploadModal = ({ onClose, onUploadSuccess, token }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title && images.length === 0) {
      alert("Please provide at least a title or an image.");
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    if (images.length > 0) {
      images.forEach(img => {
        formData.append('images', img);
      });
    }

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
      const message = error.response?.data?.error || "Failed to upload. Make sure the backend server and MySQL database are running!";
      alert(message);
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
            <label>Title (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="E.g., Neo-Tokyo Scenery (Optional)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Context / Description (Discussion)
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDescription(prev => prev + (prev.length ? '\n' : '') + '• ')}
                  className="btn-edit"
                  style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'auto' }}
                >+ Bullet</button>
                <button
                  type="button"
                  onClick={() => {
                    const lines = description.split('\n');
                    const lastLine = lines[lines.length - 1];
                    const match = lastLine.match(/^(\d+)\./);
                    const nextNum = match ? parseInt(match[1]) + 1 : 1;
                    setDescription(prev => prev + (prev.length ? '\n' : '') + `${nextNum}. `);
                  }}
                  className="btn-edit"
                  style={{ padding: '2px 8px', fontSize: '0.7rem', width: 'auto' }}
                >+ Number</button>
              </div>
            </label>
            <textarea
              className="form-control"
              rows="8"
              placeholder="Type your discussion or context here. Use the buttons above for lists..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label>Upload Pictures (Choose one or more)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', flexShrink: 0, opacity: 0.7 }}>File {idx + 1}:</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {img.name}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.2rem' }}
                  >&times;</button>
                </div>
              ))}
              
              <input 
                type="file" 
                accept="image/*"
                className="form-control-file" 
                onChange={e => {
                  if (e.target.files[0]) {
                    setImages([...images, e.target.files[0]]);
                    e.target.value = ''; // Reset input so same file can be picked if deleted
                  }
                }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.6 }}>
              Images will appear in a grid in the presentation.
            </p>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Uploading...' : 'Save Portfolio Item'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadModal;
