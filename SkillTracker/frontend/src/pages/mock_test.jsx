import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/mock_test.css";

const MockTest = () => {
  const navigate = useNavigate();
  const [mockData, setMockData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMockData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/user/get-mock-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMockData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching mock data:", err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMockData();
  }, []);

  const handleNavigate = (card) => {
    navigate(`/mock_test/${card.language}`, {
      state: { cardQuestions: card.questions, cardTime: card.time },
    });
  };

  if (loading) return <p className="loading-text">Loading mock tests...</p>;

  return (
    <div className="mocktest-page">
      <h2 className="mocktest-title">Choose A Mock Test</h2>
      <div className="mocktest-cards">
        {mockData.map((test) => (
          <div key={test.language} className="mocktest-card">
            <div className="mocktest-card-header">{test.language}</div>
            <div className="mocktest-card-content">
              <p>Questions: {test.questions}</p>
              <p>Time: {test.time} mins</p>
            </div>
            <button
              className="mocktest-button"
              onClick={() => handleNavigate(test)}
            >
              Start Mock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockTest;
