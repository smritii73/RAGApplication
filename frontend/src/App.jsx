import { useState } from 'react';
import './App.css';
import VideoCard from './components/VideoCard';
import ChatPanel from './components/ChatPanel';

function App() {
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [videoA, setVideoA] = useState(null);
  const [videoB, setVideoB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleIngest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const youtubeUrl = document.getElementById('youtubeUrl').value;
    const youtubeFollowers = parseInt(document.getElementById('youtubeFollowers').value) || 0;
    const instagramUrl = document.getElementById('instagramUrl').value;
    const instagramFollowers = parseInt(document.getElementById('instagramFollowers').value) || 0;
    const instagramLikes = parseInt(document.getElementById('instagramLikes').value) || 5000;
    const instagramComments = parseInt(document.getElementById('instagramComments').value) || 100;

    try {
      const response = await fetch('http://localhost:3001/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl,
          youtubeFollowers,
          instagramUrl,
          instagramFollowers,
          instagramLikes,
          instagramComments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ingest videos');
      }

      const data = await response.json();
      setVideoA(data.videoA);
      setVideoB(data.videoB);
      setVideosLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎬 Video Content RAG Analyzer</h1>
        <p>Compare videos, analyze engagement, ask intelligent questions</p>
      </header>

      {!videosLoaded ? (
        <form className="form-container" onSubmit={handleIngest}>
          <h2>Load Videos</h2>

          <div className="form-group">
            <label>YouTube URL</label>
            <input
              id="youtubeUrl"
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              required
            />
            <input
              id="youtubeFollowers"
              type="number"
              placeholder="Creator followers (optional)"
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Instagram Reel URL</label>
            <input
              id="instagramUrl"
              type="text"
              placeholder="https://instagram.com/reel/..."
              required
            />
            <input
              id="instagramFollowers"
              type="number"
              placeholder="Creator followers (optional)"
              min="0"
            />
            <input
              id="instagramLikes"
              type="number"
              placeholder="Likes (optional, default 5000)"
              min="0"
              defaultValue="5000"
            />
            <input
              id="instagramComments"
              type="number"
              placeholder="Comments (optional, default 100)"
              min="0"
              defaultValue="100"
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Analyze Videos'}
          </button>
        </form>
      ) : (
        <div className="main-container">
          <div className="videos-section">
            <div className="videos-grid">
              <VideoCard video={videoA} label="Video A (YouTube)" />
              <VideoCard video={videoB} label="Video B (Instagram)" />
            </div>
          </div>

          <ChatPanel />

          <button className="reset-btn" onClick={() => {
            setVideosLoaded(false);
            setVideoA(null);
            setVideoB(null);
          }}>
            ← Load Different Videos
          </button>
        </div>
      )}
    </div>
  );
}

export default App;