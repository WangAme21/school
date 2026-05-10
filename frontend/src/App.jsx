import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadModal from './components/UploadModal';
import AuthModal from './components/AuthModal';
import PresentationMode from './components/PresentationMode';
import { SortableItem } from './components/SortableItem';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentPresentationIndex, setCurrentPresentationIndex] = useState(0);
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('portfolioTheme') === 'light');

  const [token, setToken] = useState(localStorage.getItem('portfolioToken') || '');
  const [currentUsername, setCurrentUsername] = useState(localStorage.getItem('portfolioUsername') || '');

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImages, setEditImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press to start dragging on mobile
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('portfolioTheme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('portfolioTheme', 'dark');
    }
  }, [isLightMode]);

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
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
    setEditImages([]);
    setExistingImages(item.image_url ? item.image_url.split(',') : []);
  };

  const saveEdit = async (id) => {
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('description', editDescription);
      
      // Send the list of existing images to keep (as a comma-separated string)
      formData.append('existing_images', existingImages.join(','));

      if (editImages.length > 0) {
        editImages.forEach(img => {
          formData.append('images', img);
        });
      }

      const response = await axios.put(`${API_URL}/api/items/${id}`, formData, getAxiosConfig());
      setItems(items.map(item => item.id === id ? response.data : item));
      setEditingId(null);
      setEditImages([]);
    } catch (error) {
      console.error('Failed to save edit:', error);
      alert('Failed to save edit. Make sure you are authorized!');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Save to backend
      try {
        await axios.put(`${API_URL}/api/items/reorder`, {
          orderedIds: newItems.map(item => item.id)
        }, getAxiosConfig());
      } catch (error) {
        console.error('Failed to save new order:', error);
      }
    }
  };

  return (
    <div className="container">
      <header>
        <h1>My <span>Portfolio</span></h1>

        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={() => setIsLightMode(!isLightMode)}
            title="Toggle Light/Dark Mode"
          >
            {isLightMode ? '🌙' : '☀️'}
          </button>

          {items.length > 0 && (
            <button className="btn-edit" onClick={() => setIsPresentationMode(true)}>
              &#9654; Present
            </button>
          )}

          {token ? (
            <>
              <span style={{ color: 'var(--text-main)' }}>Welcome, {currentUsername}</span>
              <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                + Add New Item
              </button>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              {items.map(item => (
                <SortableItem key={item.id} id={item.id} disabled={!token || item.author_username !== currentUsername || editingId === item.id}>
                  <div className="portfolio-card">
                    {item.image_url && (
                      <img
                        src={item.image_url.startsWith('http') ? item.image_url : `${API_URL}${item.image_url}`}
                        alt={item.title}
                        className="card-image"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
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
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Description</label>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button 
                                type="button" 
                                onClick={() => setEditDescription(prev => prev + (prev.length ? '\n' : '') + '• ')}
                                style={{ padding: '2px 6px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-light)', borderRadius: '4px', cursor: 'pointer' }}
                              >+ Bullet</button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  const lines = editDescription.split('\n');
                                  const lastLine = lines[lines.length - 1];
                                  const match = lastLine.match(/^(\d+)\./);
                                  const nextNum = match ? parseInt(match[1]) + 1 : 1;
                                  setEditDescription(prev => prev + (prev.length ? '\n' : '') + `${nextNum}. `);
                                }}
                                style={{ padding: '2px 6px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-light)', borderRadius: '4px', cursor: 'pointer' }}
                              >+ Number</button>
                            </div>
                          </div>
                          <textarea
                            className="form-control"
                            rows="6"
                            style={{ marginBottom: '1rem', flexGrow: 1 }}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          ></textarea>
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>
                              Current Images
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                              {existingImages.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                  <img 
                                    src={url.startsWith('http') ? url : `${API_URL}${url}`} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} 
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => setExistingImages(existingImages.filter((_, i) => i !== idx))}
                                    style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                  >&times;</button>
                                </div>
                              ))}
                              {existingImages.length === 0 && <span style={{fontSize: '0.8rem', opacity: 0.5}}>No images</span>}
                            </div>

                            <label style={{ fontSize: '0.8rem', opacity: 0.7, display: 'block', marginBottom: '0.5rem' }}>
                              Add More Images
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {editImages.map((img, idx) => (
                                <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                  <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{img.name}</span>
                                  <button type="button" onClick={() => setEditImages(editImages.filter((_, i) => i !== idx))} style={{background:'none', border:'none', color:'#ff6b6b', cursor:'pointer'}}>&times;</button>
                                </div>
                              ))}
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    setEditImages([...editImages, e.target.files[0]]);
                                    e.target.value = '';
                                  }
                                }}
                                style={{ width: '100%', fontSize: '0.8rem' }}
                              />
                            </div>
                          </div>
                          <div className="card-actions" style={{ opacity: 1 }}>
                            <button className="btn-edit" onClick={() => saveEdit(item.id)}>Save</button>
                            <button className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="card-title">{item.title}</h3>
                          {item.description && <p className="card-desc">{item.description}</p>}

                          {item.author_username && (
                            <span className="author-tag">
                              By {item.author_username}
                            </span>
                          )}

                          {token && item.author_username === currentUsername && (
                            <div className="card-actions">
                              <button className="btn-edit" onClick={() => startEdit(item)}>Edit</button>
                              <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
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
          onUploadSuccess={(newItem) => setItems([...items, newItem])}
        />
      )}

      {isPresentationMode && (
        <PresentationMode
          items={items}
          currentIndex={currentPresentationIndex}
          setCurrentIndex={setCurrentPresentationIndex}
          onClose={() => setIsPresentationMode(false)}
          apiUrl={API_URL}
        />
      )}
    </div>
  );
}

export default App;
