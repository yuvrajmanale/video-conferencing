import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "../styles/videoMeet.css";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import server from "../environment";

const server_url = server // Use the production server URL  

var connections = {};
var pendingIceCandidates = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(false);
  let [audio, setAudio] = useState(false);
  let [screen, setScreen] = useState(false);
  let [showChat, setShowChat] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.error("Permission error:", error);
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  const getUserMediaSuccess = async (stream) => {
    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    Object.keys(connections).forEach(async (id) => {
      if (id === socketIdRef.current) return;

      const peer = connections[id];

      try {
        peer.getSenders().forEach((sender) => {
          peer.removeTrack(sender);
        });

        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socketRef.current.emit(
          "signal",
          id,
          JSON.stringify({ sdp: peer.localDescription })
        );
      } catch (e) {
        console.error("Error updating peer tracks:", e);
      }
    });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .catch((e) => console.error(e));
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined && video || audio) {
      getUserMedia();
    }
  }, [video, audio]);

  const gotMessageFromServer = async (fromId, message) => {
    const signal = JSON.parse(message);

    if (fromId === socketIdRef.current) return;

    if (!connections[fromId]) {
      console.log("Creating peer connection for:", fromId);
      const peer = new RTCPeerConnection(peerConfigConnections);
      connections[fromId] = peer;
      pendingIceCandidates[fromId] = [];

      peer.ontrack = (event) => {
        console.log("Received track from", fromId);
        const stream = event.streams[0];

        setVideos((prev) => {
          const exists = prev.find((v) => v.socketId === fromId);
          if (exists) {
            return prev.map((v) =>
              v.socketId === fromId ? { ...v, stream } : v
            );
          }
          return [...prev, { socketId: fromId, stream }];
        });
      };

      peer.onconnectionstatechange = () => {
        console.log("Connection state with", fromId, ":", peer.connectionState);
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ ice: event.candidate })
          );
        }
      };

      if (window.localStream) {
        window.localStream.getTracks().forEach((track) => {
          peer.addTrack(track, window.localStream);
        });
      }
    }

    const peer = connections[fromId];

    if (signal.sdp) {
      try {
        const rtcSessionDescription = new RTCSessionDescription(signal.sdp);
        await peer.setRemoteDescription(rtcSessionDescription);

        if (signal.sdp.type === "offer") {
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socketRef.current.emit(
            "signal",
            fromId,
            JSON.stringify({ sdp: peer.localDescription })
          );
        }

        if (pendingIceCandidates[fromId]) {
          for (const iceCandidate of pendingIceCandidates[fromId]) {
            try {
              await peer.addIceCandidate(iceCandidate);
            } catch (e) {
              console.error("Error adding pending ICE candidate:", e);
            }
          }
          pendingIceCandidates[fromId] = [];
        }
      } catch (e) {
        console.error("Error handling SDP:", e);
      }
    }

    if (signal.ice) {
      try {
        const iceCandidate = new RTCIceCandidate(signal.ice);

        if (peer.remoteDescription && peer.remoteDescription.type) {
          await peer.addIceCandidate(iceCandidate);
        } else {
          if (!pendingIceCandidates[fromId]) {
            pendingIceCandidates[fromId] = [];
          }
          pendingIceCandidates[fromId].push(iceCandidate);
        }
      } catch (e) {
        console.error("ICE error:", e);
      }
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url.dev, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      console.log("Connected to server with ID:", socketIdRef.current);

      socketRef.current.emit("join-call", "abc123");

      socketRef.current.on("user-joined", async (newUserId) => {
        console.log("User joined:", newUserId);

        if (newUserId === socketIdRef.current) return;

        if (connections[newUserId]) {
          console.log("Peer connection already exists for", newUserId);
          return;
        }

        console.log("Creating new peer for:", newUserId);
        const peer = new RTCPeerConnection(peerConfigConnections);
        connections[newUserId] = peer;
        pendingIceCandidates[newUserId] = [];

        peer.ontrack = (event) => {
          console.log("Received track from", newUserId);
          const stream = event.streams[0];

          setVideos((prev) => {
            const exists = prev.find((v) => v.socketId === newUserId);
            if (exists) {
              return prev.map((v) =>
                v.socketId === newUserId ? { ...v, stream } : v
              );
            }
            return [...prev, { socketId: newUserId, stream }];
          });
        };

        peer.onconnectionstatechange = () => {
          console.log("Connection state with", newUserId, ":", peer.connectionState);
        };

        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit(
              "signal",
              newUserId,
              JSON.stringify({ ice: event.candidate })
            );
          }
        };

        if (window.localStream) {
          window.localStream.getTracks().forEach((track) => {
            peer.addTrack(track, window.localStream);
          });
        }

        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socketRef.current.emit(
            "signal",
            newUserId,
            JSON.stringify({ sdp: peer.localDescription })
          );
        } catch (e) {
          console.error("Error creating offer:", e);
        }
      });

      socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
        addMessage(data, sender, socketIdSender);
      });

      socketRef.current.on("user-left", (id) => {
        console.log("User left:", id);

        if (connections[id]) {
          connections[id].close();
          delete connections[id];
          delete pendingIceCandidates[id];
        }

        setVideos((videos) => videos.filter((v) => v.socketId !== id));
      });
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    addMessage(message, username, socketIdRef.current);
    setMessage("");
  };

  const handleConnect = () => {
    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  if (askForUsername) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--dark-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "2rem",
        padding: "2rem"
      }}>
        <div style={{
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "20px",
          padding: "3rem 2rem",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center"
        }}>
          <h1 style={{ color: "var(--text-primary)", marginBottom: "1rem" }}>
            Enter Your Name
          </h1>

          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleConnect()}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "10px",
              color: "var(--text-primary)",
              marginBottom: "1rem",
              outline: "none",
              fontSize: "1rem"
            }}
          />

          <button
            onClick={handleConnect}
            style={{
              width: "100%",
              padding: "0.85rem 1.5rem",
              background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            Join Call
          </button>

          <video
            ref={localVideoref}
            autoPlay
            muted
            style={{
              width: "100%",
              marginTop: "1.5rem",
              borderRadius: "10px",
              background: "var(--dark-bg)"
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="video-meet-container">
      <div className="video-grid-area">
        <div className="conference-view">
          {videos.map((video) => (
            <div key={video.socketId} className="video-item">
              <video
                ref={(ref) => {
                  if (ref && video.stream) {
                    ref.srcObject = video.stream;
                    ref.play().catch((e) => {
                      // AbortError is expected when stream updates happen rapidly
                      if (e.name !== 'AbortError') {
                        console.error("Error playing video:", e);
                      }
                    });
                  }
                }}
                autoPlay
                playsInline
              />
              <div className="video-label">User {video.socketId.substring(0, 6)}</div>
            </div>
          ))}
        </div>

        <div className="local-video-wrapper">
          <video
            ref={localVideoref}
            autoPlay
            muted
          />
          <div className="video-label">{username} (You)</div>
        </div>
      </div>

      {showChat && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h2>💬 Chat</h2>
            <button
              className="chat-close-btn"
              onClick={() => setShowChat(false)}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                <p>No messages yet. Start chatting!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="chat-message">
                  <div className="chat-message-sender">{msg.sender}</div>
                  <div className="chat-message-text">{msg.data}</div>
                </div>
              ))
            )}
          </div>

          <div className="chat-input-area">
            <textarea
              className="chat-input"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button className="chat-send-btn" onClick={sendMessage}>
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      <div className="control-bar">
        <button
          className={`control-button ${video ? "active" : "inactive"}`}
          onClick={() => setVideo(!video)}
          title="Toggle Video"
        >
          {video ? <VideocamIcon /> : <VideocamOffIcon />}
        </button>

        <button
          className={`control-button ${audio ? "active" : "inactive"}`}
          onClick={() => setAudio(!audio)}
          title="Toggle Audio"
        >
          {audio ? <MicIcon /> : <MicOffIcon />}
        </button>

        {screenAvailable && (
          <button
            className={`control-button ${screen ? "active" : ""}`}
            onClick={() => setScreen(!screen)}
            title="Share Screen"
          >
            {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
          </button>
        )}

        <button
          className="control-button"
          onClick={() => setShowChat(!showChat)}
          title="Toggle Chat"
        >
          <ChatIcon />
        </button>

        <button
          className="control-button end-call"
          onClick={handleEndCall}
          title="End Call"
        >
          <CallEndIcon />
        </button>
      </div>
    </div>
  );
}
