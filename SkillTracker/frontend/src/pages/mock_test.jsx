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

  const handleClick = (card) => {
    navigate(`/mock_test/${card.language}`, {
      state: { cardQuestions: card.questions, cardTime: card.time },
    });
  };

  if (loading) return <p>Loading mock tests...</p>;

  return (
    <div className="mocktest-page">
      <h2 className="mocktest-title">Mock Tests</h2>
      <div className="mocktest-cards">
        {mockData.map((test) => (
          <div
            key={test.language}
            className="mocktest-card"
            onClick={() => handleClick(test)}
          >
            <h3>{test.language}</h3>
            <p>Questions: {test.questions}</p>
            <p>Time: {test.time} mins</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockTest;
