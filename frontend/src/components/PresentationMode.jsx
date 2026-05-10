import React, { useEffect, useState } from 'react';

const PresentationMode = ({ items, currentIndex, setCurrentIndex, onClose, apiUrl, theme, setTheme }) => {
  const themes = [
    { id: 'midnight', color: '#050505', name: 'Midnight' },
    { id: 'solar', color: '#fdf6e3', name: 'Solar' },
    { id: 'neon', color: '#ff00ff', name: 'Neon' },
    { id: 'forest', color: '#0a1f1a', name: 'Forest' },
    { id: 'deepsea', color: '#005f73', name: 'Deep Sea' },
    { id: 'gallery', color: '#ffffff', name: 'Art Gallery' },
    { id: 'cyber', color: '#0f0c29', name: 'Cyberpunk' },
    { id: 'retro', color: '#f4ebd0', name: 'Retro Paper' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, onClose, setCurrentIndex]);

  if (!items.length) return null;

  const currentItem = items[currentIndex];
  const isImageOnly = !currentItem.title && !currentItem.description;

  return (
    <div className={`presentation-overlay theme-${theme}`}>
      {/* Ornate Corners */}
      <div className="ornate-corner tl"></div>
      <div className="ornate-corner tr"></div>
      <div className="ornate-corner bl"></div>
      <div className="ornate-corner br"></div>

      <div className="theme-picker">
        {themes.map((t) => (
          <div
            key={t.id}
            className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
            style={{ backgroundColor: t.color }}
            onClick={() => setTheme(t.id)}
            title={t.name}
          />
        ))}
      </div>
      <button className="presentation-close" onClick={onClose}>&times;</button>

      <div className="presentation-content">
        <button
          className="presentation-nav prev"
          onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
        >
          &#8249;
        </button>

        <div className={`presentation-main ${isImageOnly ? 'full-screen' : ''}`}>
          {currentItem.image_url ? (
            <div className="presentation-frame">
              <div
                className={`presentation-image-wrapper ${currentItem.image_url.split(',').length > 1 ? 'multi-image-grid' : ''}`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  if (x < rect.width / 2) {
                    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
                  } else {
                    setCurrentIndex((prev) => (prev + 1) % items.length);
                  }
                }}
              >
                {currentItem.image_url.split(',').map((url, idx) => (
                  <img
                    key={idx}
                    src={url.startsWith('http') ? url : `${apiUrl}${url}`}
                    alt={`${currentItem.title || 'Image'} ${idx + 1}`}
                    className="presentation-image"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="presentation-image-wrapper no-image"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                if (x < rect.width / 2) {
                  setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
                } else {
                  setCurrentIndex((prev) => (prev + 1) % items.length);
                }
              }}
            >
            </div>
          )}
          <div className={`presentation-info ${isImageOnly ? 'hidden' : ''}`}>
            {currentItem.title && <h2>{currentItem.title}</h2>}
            {currentItem.description && <p>{currentItem.description}</p>}
            <div className="presentation-counter">
              {currentIndex + 1} / {items.length}
            </div>
          </div>
        </div>

        <button
          className="presentation-nav next"
          onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
        >
          &#8250;
        </button>
      </div>
    </div>
  );
};

export default PresentationMode;
