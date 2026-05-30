import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const RAGVideoChatbot = () => {
  const [videoAUrl, setVideoAUrl] = useState('');
  const [videoBUrl, setVideoBUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState({ A: null, B: null });
  const [conversation, setConversation] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const [engagementRates, setEngagementRates] = useState({ A: 0, B: 0 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleIngestVideos = async (e) => {
    e.preventDefault();
    if (!videoAUrl || !videoBUrl) {
      alert('Please provide both video URLs');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_a_url: videoAUrl,
          video_b_url: videoBUrl
        })
      });

      const result = await response.json();

      if (result.video_a?.status === 'success' && result.video_b?.status === 'success') {
        const metaA = { ...result.video_a.metadata };
        const metaB = { ...result.video_b.metadata };

        // Auto-estimate views on-the-fly if 0 in ingestion results
        if ((metaA.views === 0 || !metaA.views) && metaA.likes > 0) {
          metaA.views = Math.round(metaA.likes * 7.5);
          metaA.engagement_rate = ((metaA.likes + metaA.comments) / metaA.views) * 100;
        }
        if ((metaB.views === 0 || !metaB.views) && metaB.likes > 0) {
          metaB.views = Math.round(metaB.likes * 7.5);
          metaB.engagement_rate = ((metaB.likes + metaB.comments) / metaB.views) * 100;
        }

        setVideoMetadata({
          A: metaA,
          B: metaB
        });

        setEngagementRates({
          A: metaA.engagement_rate || 0,
          B: metaB.engagement_rate || 0
        });

        setConversation([{
          role: 'assistant',
          content: `✓ Loaded "${metaA.title}" (${metaA.views.toLocaleString()} views) and "${metaB.title}" (${metaB.views.toLocaleString()} views). Ready to analyze!`,
          sources: []
        }]);
      } else {
        throw new Error(result.video_a?.error || result.video_b?.error || 'Ingestion failed');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMetadata = (letter, updatedMeta) => {
    setVideoMetadata(prev => ({
      ...prev,
      [letter]: updatedMeta
    }));
    setEngagementRates(prev => ({
      ...prev,
      [letter]: updatedMeta.engagement_rate || 0
    }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentQuestion.trim() || !videoMetadata.A) return;

    const newMessage = {
      role: 'user',
      content: currentQuestion,
      sources: []
    };

    setConversation(prev => [...prev, newMessage, { role: 'assistant', content: '', sources: [] }]);
    setCurrentQuestion('');
    setIsStreaming(true);

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_a_url: videoAUrl,
          video_b_url: videoBUrl,
          question: currentQuestion,
          conversation_history: conversation,
          video_a_metadata: videoMetadata.A,
          video_b_metadata: videoMetadata.B
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantMessage = { role: 'assistant', content: '', sources: [] };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line);
            if (data.type === 'answer') {
              assistantMessage.content = data.content;
            } else if (data.type === 'sources') {
              assistantMessage.sources = data.sources;
            } else if (data.type === 'error') {
              assistantMessage.content = `Error: ${data.error}`;
            }
            setConversation(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...assistantMessage };
              return updated;
            });
          }
        }
      }
    } catch (error) {
      setConversation(prev => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: `Error: ${error.message}`,
          sources: []
        }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const VideoCard = ({ letter, metadata, engagementRate }) => {
    if (!metadata) return null;

    const [localEdit, setLocalEdit] = useState(false);
    const [title, setTitle] = useState(metadata.title || '');
    const [creator, setCreator] = useState(metadata.creator || '');
    const [views, setViews] = useState(metadata.views || 0);
    const [likes, setLikes] = useState(metadata.likes || 0);
    const [comments, setComments] = useState(metadata.comments || 0);
    const [duration, setDuration] = useState(metadata.duration || 0);
    const [followerCount, setFollowerCount] = useState(metadata.follower_count || 0);
    const [followingCount, setFollowingCount] = useState(metadata.following_count || 0);

    useEffect(() => {
      let currentViews = metadata.views || 0;
      const currentLikes = metadata.likes || 0;
      const currentComments = metadata.comments || 0;

      // Component-level Safeguard: auto-estimate views if they are 0 but likes exist
      if (currentViews === 0 && currentLikes > 0) {
        currentViews = Math.round(currentLikes * 7.5);
        // Sync estimated metadata back to parent state after a micro-delay to prevent render loops
        setTimeout(() => {
          handleUpdateMetadata(letter, {
            ...metadata,
            views: currentViews,
            engagement_rate: ((currentLikes + currentComments) / currentViews) * 100
          });
        }, 100);
      }

      setTitle(metadata.title || '');
      setCreator(metadata.creator || '');
      setViews(currentViews);
      setLikes(currentLikes);
      setComments(currentComments);
      setDuration(metadata.duration || 0);
      setFollowerCount(metadata.follower_count || 0);
      setFollowingCount(metadata.following_count || 0);
    }, [metadata]);

    const handleSave = () => {
      const updatedMeta = {
        ...metadata,
        title,
        creator,
        views: parseInt(views) || 0,
        likes: parseInt(likes) || 0,
        comments: parseInt(comments) || 0,
        duration: parseInt(duration) || 0,
        follower_count: parseInt(followerCount) || 0,
        following_count: parseInt(followingCount) || 0,
        is_fallback: false
      };
      
      const v = updatedMeta.views || 1;
      const l = updatedMeta.likes;
      const c = updatedMeta.comments;
      updatedMeta.engagement_rate = ((l + c) / v) * 100;
      
      handleUpdateMetadata(letter, updatedMeta);
      setLocalEdit(false);
    };

    const formatMetricValue = (value) => {
      const num = parseInt(value) || 0;
      if (num < 10000) {
        return num.toLocaleString();
      } else if (num < 1000000) {
        const kValue = num / 1000;
        return kValue % 1 === 0 ? `${kValue.toFixed(0)}K` : `${kValue.toFixed(1)}K`;
      } else {
        const mValue = num / 1000000;
        return mValue % 1 === 0 ? `${mValue.toFixed(0)}M` : `${mValue.toFixed(1)}M`;
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      
      // Check if YYYYMMDD format and convert to YYYY-MM-DD
      let formattedStr = dateStr;
      if (/^\d{8}$/.test(dateStr)) {
        formattedStr = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
      }
      
      const parsedDate = new Date(formattedStr);
      if (isNaN(parsedDate.getTime())) {
        return dateStr;
      }
      return parsedDate.toLocaleDateString();
    };

    const rate = engagementRate || metadata.engagement_rate || 0;
    const engagementColor = rate > 5 ? '#10b981' : rate > 2 ? '#f59e0b' : '#ef4444';

    if (localEdit) {
      return (
        <div className="video-card editing" style={{ border: '1px solid #38bdf8', boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)' }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(30, 41, 59, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="video-letter">{letter}</span>
              <span className="platform-badge">{(metadata.platform || "unknown").toUpperCase()}</span>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold' }}>Editing...</span>
          </div>

          <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Title</label>
              <textarea 
                rows="2"
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', resize: 'none', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Creator</label>
              <input 
                type="text" 
                value={creator} 
                onChange={(e) => setCreator(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Views</label>
                <input 
                  type="number" 
                  value={views} 
                  onChange={(e) => setViews(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Likes</label>
                <input 
                  type="number" 
                  value={likes} 
                  onChange={(e) => setLikes(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Comments</label>
                <input 
                  type="number" 
                  value={comments} 
                  onChange={(e) => setComments(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Duration (sec)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: metadata.platform === 'instagram' ? '1fr 1fr' : '1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                  {metadata.platform === 'youtube' ? 'Subscribers' : 'Followers'}
                </label>
                <input 
                  type="number" 
                  value={followerCount} 
                  onChange={(e) => setFollowerCount(e.target.value)}
                  style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                />
              </div>
              {metadata.platform === 'instagram' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>Following</label>
                  <input 
                    type="number" 
                    value={followingCount} 
                    onChange={(e) => setFollowingCount(e.target.value)}
                    style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none', width: '100%' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button" 
                onClick={handleSave}
                style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'background 0.2s' }}
              >
                Save Metrics
              </button>
              <button 
                type="button" 
                onClick={() => setLocalEdit(false)}
                style={{ flex: 1, background: '#475569', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', transition: 'background 0.2s' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="video-card" style={{ position: 'relative' }}>
        {metadata.is_fallback && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.75rem',
            padding: '6px 12px',
            textAlign: 'center',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            ⚠️ Rate-limited/Blocked. Fallback data loaded.
          </div>
        )}

        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="video-letter">{letter}</span>
            <span className="platform-badge">{(metadata.platform || "unknown").toUpperCase()}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setLocalEdit(true)}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            ✏️ Edit Metrics
          </button>
        </div>

        <div className="card-content">
          <h3 className="video-title" title={metadata.title}>
            {(metadata.title || "Untitled Video").substring(0, 50)}...
          </h3>

          <div className="creator-info">
            <span className="creator-name">{metadata.creator || "Unknown Creator"}</span>
            {metadata.follower_count > 0 && (
              <span className="followers">
                {metadata.platform === 'youtube' ? (
                  `${formatMetricValue(metadata.follower_count)} subscribers`
                ) : (
                  `${formatMetricValue(metadata.follower_count)} followers • ${formatMetricValue(metadata.following_count || 0)} following`
                )}
              </span>
            )}
          </div>

          <div className="metrics-grid">
            <div className="metric">
              <div className="metric-value">{formatMetricValue(metadata.views)}</div>
              <div className="metric-label">Views</div>
            </div>
            <div className="metric">
              <div className="metric-value">{formatMetricValue(metadata.likes)}</div>
              <div className="metric-label">Likes</div>
            </div>
            <div className="metric">
              <div className="metric-value">{formatMetricValue(metadata.comments)}</div>
              <div className="metric-label">Comments</div>
            </div>
          </div>

          <div className="engagement-metric" style={{ borderBottomColor: engagementColor }}>
            <div className="engagement-label">Engagement Rate</div>
            <div className="engagement-value" style={{ color: engagementColor }}>
              {rate.toFixed(2)}%
            </div>
          </div>

          <div className="metadata-footer">
            <span className="duration">
              {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
            </span>
            <span className="upload-date">
              {formatDate(metadata.upload_date)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const SourceCitation = ({ source }) => {
    return (
      <div className="source-citation">
        <span className="source-video">Video {source.video_id}</span>
        <span className="source-text">"{source.chunk.substring(0, 60)}..."</span>
        <span className="source-score">{(source.score * 100).toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div className="header-content">
          <h1>RAG Video Analyst (Updated)</h1>
          <p>Compare and analyze social media videos with AI</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {!videoMetadata.A ? (
          /* Input Stage */
          <form className="input-form" onSubmit={handleIngestVideos}>
            <div className="form-group">
              <label>YouTube Video URL</label>
              <input
                type="url"
                value={videoAUrl}
                onChange={(e) => setVideoAUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Instagram Reels URL</label>
              <input
                type="url"
                value={videoBUrl}
                onChange={(e) => setVideoBUrl(e.target.value)}
                placeholder="https://instagram.com/reels/..."
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Loading Videos...
                </>
              ) : (
                'Load & Analyze'
              )}
            </button>
          </form>
        ) : (
          /* Analysis Stage */
          <div className="analysis-layout">
            {/* Left: Video Cards */}
            <div className="videos-panel">
              <div className="videos-grid">
                <VideoCard letter="A" metadata={videoMetadata.A} engagementRate={engagementRates.A} />
                <VideoCard letter="B" metadata={videoMetadata.B} engagementRate={engagementRates.B} />
              </div>

              {/* Comparison Badge */}
              <div className="comparison-badge">
                <div className="comparison-label">Engagement Winner</div>
                <div className="comparison-result">
                  {engagementRates.A > engagementRates.B ? (
                    <>
                      <span className="winner-letter">A</span>
                      <span className="winner-diff">+{(engagementRates.A - engagementRates.B).toFixed(2)}%</span>
                    </>
                  ) : engagementRates.B > engagementRates.A ? (
                    <>
                      <span className="winner-letter">B</span>
                      <span className="winner-diff">+{(engagementRates.B - engagementRates.A).toFixed(2)}%</span>
                    </>
                  ) : (
                    <span className="winner-tie">Tied</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Chat Panel */}
            <div className="chat-panel">
              <div className="chat-header">
                <h2>Analysis Chat</h2>
                <p>Ask questions about these videos</p>
              </div>

              <div className="messages-container">
                {conversation.map((msg, idx) => (
                  <div key={idx} className={`message message-${msg.role}`}>
                    <div className="message-content">
                      <div className="message-text">{msg.content}</div>

                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="message message-assistant">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={currentQuestion}
                  onChange={(e) => setCurrentQuestion(e.target.value)}
                  placeholder="Ask a question (e.g., 'Why does A have better engagement?')"
                  disabled={isStreaming}
                  className="message-input"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !currentQuestion.trim()}
                  className="send-button"
                >
                  {isStreaming ? <span className="spinner"></span> : '→'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RAGVideoChatbot;