import React, { useEffect, useState } from 'react';

const PresentationMode = ({ items, currentIndex, setCurrentIndex, onClose, apiUrl, theme, setTheme }) => {
  const [zoomedImage, setZoomedImage] = useState(null);

  const themes = [
    { id: 'midnight', color: '#050505', name: 'Midnight' },
    { id: 'solar', color: '#fdf6e3', name: 'Solar' },
    { id: 'forest', color: '#0a1f1a', name: 'Forest' },
    { id: 'deepsea', color: '#005f73', name: 'Deep Sea' },
    { id: 'gallery', color: '#ffffff', name: 'Art Gallery' },
    { id: 'retro', color: '#f4ebd0', name: 'Retro Paper' },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (zoomedImage) {
        if (e.key === 'Escape') setZoomedImage(null);
        return;
      }
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
  }, [items.length, onClose, setCurrentIndex, zoomedImage]);

  if (!items.length) return null;

  const currentItem = items[currentIndex];
  const isImageOnly = !currentItem.title && !currentItem.description;

  return (
    <div className={`presentation-overlay theme-${theme} ${zoomedImage ? 'zoomed-mode' : ''}`}>
      {/* Ornate Corners */}
      <div className="ornate-corner tl"></div>
      <div className="ornate-corner tr"></div>
      <div className="ornate-corner bl"></div>
      <div className="ornate-corner br"></div>

      {!zoomedImage && (
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
      )}

      <button className="presentation-close" onClick={zoomedImage ? () => setZoomedImage(null) : onClose}>&times;</button>
      
      <div className="presentation-content">
        {!zoomedImage && (
          <button
            className="presentation-nav prev"
            onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
          >
            &#8249;
          </button>
        )}

        <div className={`presentation-main ${isImageOnly ? 'full-screen' : ''}`}>
          {currentItem.image_url ? (
            <div className="presentation-frame">
              <div className={`presentation-image-wrapper ${currentItem.image_url.split(',').length > 1 ? 'multi-image-grid' : ''}`}>
                {currentItem.image_url.split(',').map((url, idx) => (
                  <img
                    key={idx}
                    src={url.startsWith('http') ? url : `${apiUrl}${url}`}
                    alt={`${currentItem.title || 'Image'} ${idx + 1}`}
                    className="presentation-image"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setZoomedImage(url.startsWith('http') ? url : `${apiUrl}${url}`)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="presentation-image-wrapper no-image"></div>
          )}
          <div className={`presentation-info ${isImageOnly || zoomedImage ? 'hidden' : ''}`}>
            {currentItem.title && <h2>{currentItem.title}</h2>}
            {currentItem.description && <p>{currentItem.description}</p>}
            <div className="presentation-counter">
              {currentIndex + 1} / {items.length}
            </div>
          </div>
        </div>

        {!zoomedImage && (
          <button
            className="presentation-nav next"
            onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
          >
            &#8250;
          </button>
        )}
      </div>

      {zoomedImage && (
        <div className="fullscreen-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} className="zoomed-image-focused" alt="Focused" />
          <div className="zoom-hint">Click image or press ESC to close</div>
        </div>
      )}
    </div>
  );
};

export default PresentationMode;
