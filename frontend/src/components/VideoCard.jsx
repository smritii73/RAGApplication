export default function VideoCard({ video, label }) {
  if (!video) return null;

  const metadata = video.metadata;
  const engagement = video.engagement;

  return (
    <div className="video-card">
      <h3>{label}</h3>

      <div className="video-meta">
        <p><strong>{metadata.title}</strong></p>
        <p className="channel">By {metadata.channel}</p>

        <div className="stats">
          <div className="stat">
            <span className="label">Views</span>
            <span className="value">{(metadata.views / 1000).toFixed(1)}K</span>
          </div>
          <div className="stat">
            <span className="label">Likes</span>
            <span className="value">{(metadata.likes / 1000).toFixed(1)}K</span>
          </div>
          <div className="stat">
            <span className="label">Comments</span>
            <span className="value">{(metadata.comments || 0) / 100 > 0 ? (metadata.comments / 100).toFixed(0) + 'K' : metadata.comments || 'N/A'}</span>
          </div>
        </div>

        <div className="engagement-rate">
          <span className="label">Engagement Rate</span>
          <span className="rate">{engagement.engagementRate}</span>
        </div>

        <div className="meta-info">
          <p><strong>Duration:</strong> {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}</p>
          <p><strong>Uploaded:</strong> {metadata.upload_date}</p>
          {metadata.followers && <p><strong>Creator Followers:</strong> {(metadata.followers / 1000).toFixed(1)}K</p>}
        </div>

        <a href={metadata.url} target="_blank" rel="noopener noreferrer" className="video-link">
          Watch Video →
        </a>
      </div>
    </div>
  );
}