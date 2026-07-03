

import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import '../styles/history.css';
import HomeIcon from '@mui/icons-material/Home';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        console.log("HISTORY:", history);
        setMeetings(history || []);
      } catch (err) {
        console.error("Error fetching history:", err);
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear();
    return `${day}/${month}/${year}`
  }

  const handleJoinMeeting = (code) => {
    routeTo(`/${code}`);
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  }

  const handleDeleteMeeting = (index) => {
    setMeetings(meetings.filter((_, i) => i !== index));
  }

  return (
    <div className="history-container">
      <div className="history-wrapper">
        {/* Header */}
        <div className="history-header">
          <div className="history-header-title">
            <h1>Meeting History</h1>
            <p>Your previous video calls and meetings</p>
          </div>
          <div className="history-header-actions">
            <button className="history-button secondary" onClick={() => routeTo("/home")}>
              <HomeIcon style={{ marginRight: '0.5rem', fontSize: '1.2rem' }} />
              Back to Home
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="history-empty">
            <p>Loading...</p>
          </div>
        ) : meetings && meetings.length > 0 ? (
          <div className="history-grid">
            {meetings.map((meeting, index) => (
              <div key={index} className="history-card">
                <div className="history-card-header">
                  <div>
                    <div className="history-card-title">Meeting Code</div>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', fontWeight: '600', color: 'var(--accent)', marginTop: '0.5rem' }}>
                      {meeting.meetingCode}
                    </div>
                  </div>
                  <div className="history-card-badge">
                    Recent
                  </div>
                </div>

                <div className="history-card-date">
                  📅 {formatDate(meeting.date)}
                </div>

                <div className="history-card-actions">
                  <button
                    className="history-card-button"
                    onClick={() => handleJoinMeeting(meeting.meetingCode)}
                    title="Join this meeting"
                  >
                    <PlayArrowIcon style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                    Join
                  </button>
                  <button
                    className="history-card-button"
                    onClick={() => handleCopyCode(meeting.meetingCode)}
                    title="Copy meeting code"
                  >
                    <ContentCopyIcon style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                    Copy
                  </button>
                  <button
                    className="history-card-button danger"
                    onClick={() => handleDeleteMeeting(index)}
                    title="Delete from history"
                  >
                    <DeleteIcon style={{ fontSize: '1rem', marginRight: '0.25rem' }} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <div className="history-empty-icon">📭</div>
            <h2>No Meeting History</h2>
            <p>You haven't joined any meetings yet. Start a new meeting to get started!</p>
            <button className="history-button" onClick={() => routeTo("/home")}>
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}