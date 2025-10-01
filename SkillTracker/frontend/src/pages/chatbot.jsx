import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane, faVolumeHigh, faToggleOn, faToggleOff, faTrash } from "@fortawesome/free-solid-svg-icons";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "../styles/chatbot.css";

const MySwal = withReactContent(Swal);

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState({ username: "User" });
  const [activeSoundIdx, setActiveSoundIdx] = useState(null);
  const chatEndRef = useRef(null);
  const speakingRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.post(
          `/api/v1/user/get_User_data`,
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        const data = res.data.data;
        if (typeof data === "string") {
          setUser({ username: data });
        } else {
          setUser({
            username: data.username || data.name || "User",
            isAdmin: data.isAdmin || false,
            email: data.email || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user:", err.message);
        setUser({ username: "User" });
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await axios.get("/api/v1/user/chat-history", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.data.success) {
          setMessages(res.data.chatHistory);
        }
      } catch (err) {
        console.error("Error fetching chat history:", err.message);
      }
    };

    fetchUser();
    fetchHistory();
  }, []);

  
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", text: input, time: new Date() };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/v1/user/chatbot",
        { messages: [{ text: input }] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const botMessage = {
          role: "bot",
          text: res.data.response,
          time: new Date(res.data.timestamp),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Error: " + res.data.message, time: new Date() },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Server error. " + (err.response?.data?.message || "Please try again."),
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  
  const handleClearChat = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to clear all messages?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete("/api/v1/user/clear-chat-history", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.data.success) {
        setMessages([]);
        toast.success("Chat deleted successfully!");
        MySwal.fire("Cleared!", "Your chat history has been removed.", "success");
      }
    } catch (err) {
      toast.error("Error clearing chat: " + (err.response?.data?.message || err.message));
      console.error("Error clearing chat:", err.message);
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };


  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem("darkMode", newMode ? "on" : "off");
      return newMode;
    });
  };

  const handleBubbleClick = (msg, idx) => {
    if (activeSoundIdx === idx) {
      setActiveSoundIdx(null);
      speechSynthesis.cancel();
      speakingRef.current = null;
    } else {
      setActiveSoundIdx(idx);
      speakText(msg.text, idx);
    }
  };

  const speakText = (text, idx) => {
    if (speakingRef.current !== null) {
      speechSynthesis.cancel();
      speakingRef.current = null;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      speakingRef.current = null;
    };
    speechSynthesis.speak(utterance);
    speakingRef.current = idx;
  };

  useEffect(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "on") setDarkMode(true);
  }, []);

  return (
    <div className={`chatbot-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="chat-header">
        <span>Hello, {user?.username}</span>
        <div>
          <button onClick={toggleDarkMode} className="btn-toggle">
            {darkMode ? <FontAwesomeIcon icon={faToggleOn} /> : <FontAwesomeIcon icon={faToggleOff} />}
          </button>
          <button onClick={handleClearChat} className="btn-clear">
            <FontAwesomeIcon icon={faTrash} /> Clear Chat
          </button>
        </div>
      </div>

      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble ${msg.role === "user" ? "from-user" : "from-bot"} ${activeSoundIdx === idx ? "active-sound" : ""}`}
            onClick={() => handleBubbleClick(msg, idx)}
          >
            <strong>{msg.role === "user" ? user?.username || "You" : "Gemini"}</strong>
            <div
              className="bubble-content"
              dangerouslySetInnerHTML={{
                __html: msg.text.replace(/```([\s\S]*?)```/g, (match, p1) => `<pre><code>${p1}</code></pre>`),
              }}
            />
            {activeSoundIdx === idx && (
              <span className="volume-icon">
                <FontAwesomeIcon icon={faVolumeHigh} />
              </span>
            )}
            <small>
              {msg.time ? new Date(msg.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </small>
          </div>
        ))}
        {loading && <div className="chat-bubble from-bot">Typing...</div>}
        <div ref={chatEndRef}></div>
      </div>

      <div className="input-row">
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </div>
  );
}

export default Chatbot;
