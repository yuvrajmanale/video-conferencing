import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../styles/home.css";
import { AuthContext } from '../contexts/AuthContext';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) {
      alert("Please enter a meeting code");
      return;
    }
    try {
      await addToUserHistory(meetingCode)
      navigate(`/${meetingCode}`)
    } catch (err) {
      console.error("Error joining call:", err);
      alert("Error joining call. Please try again.");
    }
  }

  return (
    <div className="home-container">
      <nav className="home-navbar">
        <div className="home-navbar-logo">
          <h2>📹 VideoCall Pro</h2>
        </div>

        <div className="home-navbar-right">
          <a
            className="home-navbar-link"
            onClick={() => navigate("/history")}
          >
            <HistoryIcon style={{ fontSize: '1.2rem' }} />
            <span>History</span>
          </a>

          <button
            className="home-navbar-button"
            onClick={() => {
              localStorage.removeItem("token")
              navigate("/auth")
            }}
          >
            <LogoutIcon style={{ fontSize: '1rem', marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      </nav>

      <div className="home-wrapper">
        <div className="home-main">
          <div className="home-left">
            <h1>
              Premium Video <span>Conferencing</span> Made Simple
            </h1>
            <p>
              Connect with anyone, anywhere, anytime. Experience crystal-clear HD video calls with our modern platform. Start a meeting or join one in seconds.
            </p>

            <div className="home-input-group">
              <input
                type="text"
                className="home-input"
                placeholder="Enter meeting code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinVideoCall()}
              />
              <button
                className="home-button"
                onClick={handleJoinVideoCall}
              >
                Join Meeting
              </button>
            </div>
          </div>

          <div className="home-right">
            <div className="home-image-wrapper">
              <img src='/logo3.png' alt="Video conferencing illustration" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(HomeComponent)