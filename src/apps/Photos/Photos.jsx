import { useState, useEffect } from 'react';
import './Photos.css';

const PHOTO_GALLERY = [
  {
    id: "portrait",
    title: "sumedh_portrait.raw",
    date: "2025-10-15",
    camera: "Fujifilm X-T4",
    lens: "XF 56mm f/1.2 R WR",
    specs: "ISO 160 · f/1.2 · 1/160s",
    src: `${import.meta.env.BASE_URL}assets/img/portrait.jpg`,
    desc: "Official portrait headshot. Captured outdoors in natural morning ambient light."
  },
  {
    id: "poster",
    title: "film_poster.raw",
    date: "2026-01-20",
    camera: "Sony A7R V",
    lens: "FE 24-70mm f/2.8 GM II",
    specs: "ISO 100 · f/4.0 · 1/125s",
    src: `${import.meta.env.BASE_URL}assets/img/poster.jpg`,
    desc: "Official key art layout poster graphic design file."
  },
  {
    id: "film_still",
    title: "film_still_night.raw",
    date: "2026-03-12",
    camera: "Arri Alexa Mini",
    lens: "Cooke S4/i 35mm",
    specs: "ISO 800 · f/2.0 · 1/48s",
    src: `${import.meta.env.BASE_URL}assets/img/film_still.jpg`,
    desc: "Late night setup during the final scenes. Neon highlighting on the camera rig."
  },
  {
    id: "writing_desk",
    title: "golden_hour_script.raw",
    date: "2026-04-05",
    camera: "Leica M10-R",
    lens: "Summilux 50mm f/1.4",
    specs: "ISO 200 · f/1.4 · 1/250s",
    src: `${import.meta.env.BASE_URL}assets/img/writing_desk.jpg`,
    desc: "Golden hour sun hitting the screenwriting desk. Outlining drafts."
  }
];

function PhotosApp() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none'); // 'none', 'sepia', 'mono', 'warm'

  useEffect(() => {
    let interval = null;
    if (slideshowPlaying) {
      interval = setInterval(() => {
        setSelectedPhoto(current => {
          const idx = PHOTO_GALLERY.findIndex(p => p.id === (current ? current.id : ''));
          const nextIdx = (idx + 1) % PHOTO_GALLERY.length;
          return PHOTO_GALLERY[nextIdx];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [slideshowPlaying]);

  const handleSlideshowToggle = () => {
    const nextState = !slideshowPlaying;
    setSlideshowPlaying(nextState);
    if (nextState) {
      setSelectedPhoto(PHOTO_GALLERY[0]);
    }
  };

  const selectPhotoDirect = (photo) => {
    setSelectedPhoto(photo);
    setSlideshowPlaying(false);
  };

  if (selectedPhoto) {
    return (
      <div className="ph-detail-view">
        <div className="ph-detail-header mono">
          <button className="ph-back-btn" onClick={() => { setSelectedPhoto(null); setSlideshowPlaying(false); }}>
            &larr; BACK TO ALBUM
          </button>

          <div className="ph-controls">
            <button className={"ph-slideshow-btn " + (slideshowPlaying ? "ph-slideshow-btn--active" : "")} onClick={handleSlideshowToggle}>
              {slideshowPlaying ? "⏸ PAUSE SLIDESHOW" : "▶ PLAY SLIDESHOW"}
            </button>
            <div className="ph-filter-group">
              <span className="ph-filter-label">FILTER:</span>
              {['none', 'mono', 'sepia', 'warm'].map(f => (
                <button
                  key={f}
                  className={"ph-filter-btn " + (activeFilter === f ? "ph-filter-btn--active" : "")}
                  onClick={() => setActiveFilter(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ph-detail-body">
          <div className="ph-lightbox">
            <img
              src={selectedPhoto.src}
              alt={selectedPhoto.title}
              className={"ph-lightbox-img ph-filter--" + activeFilter}
            />
          </div>
          <div className="ph-log-panel mono">
            <div className="ph-log-heading">
              <div className="ph-log-title">{selectedPhoto.title}</div>
              <div className="ph-log-subtitle">EXIF METADATA RAW FILE</div>
            </div>
            <dl className="ph-log-list">
              <div><dt>DATE</dt><dd>{selectedPhoto.date}</dd></div>
              <div><dt>CAMERA</dt><dd>{selectedPhoto.camera}</dd></div>
              <div><dt>LENS</dt><dd>{selectedPhoto.lens}</dd></div>
              <div><dt>EXPOSURE</dt><dd>{selectedPhoto.specs}</dd></div>
            </dl>
            <p className="ph-log-desc">
              {selectedPhoto.desc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-sheet-view">
      <div className="ph-sheet-header mono">
        <span>ALBUM: /home/sumedh/photos</span>
        <button className="ph-slideshow-btn ph-slideshow-btn--compact" onClick={handleSlideshowToggle}>
          ▶ PLAY SLIDESHOW
        </button>
        <span>4 RAW IMAGES</span>
      </div>
      <div className="ph-sheet-grid">
        {PHOTO_GALLERY.map((photo, index) => (
          <div
            key={photo.id}
            className="ph-frame"
            onClick={() => selectPhotoDirect(photo)}
          >
            <div className="ph-sprocket ph-sprocket--top"><span /><span /><span /><span /><span /></div>
            <span className="ph-frame-number mono">{String(index + 1).padStart(2, '0')}</span>
            <div className="ph-frame-img-wrap">
              <img src={photo.src} alt={photo.title} />
            </div>
            <div className="ph-frame-caption mono">
              {photo.title}
            </div>
            <div className="ph-sprocket ph-sprocket--bottom"><span /><span /><span /><span /><span /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotosApp;
