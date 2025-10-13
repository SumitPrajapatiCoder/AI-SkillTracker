import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import "../styles/quiz.css";

function Quiz() {
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/user/get-quiz-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizData(res.data.data || []);
    } catch (err) {
      console.error("Error fetching quiz data:", err.response || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizData();
  }, []);

  const handleNavigate = (card) => {
    navigate(`/quiz/${card.language}`, {
      state: { cardQuestions: card.questions, cardTime: card.time },
    });
  };

  if (loading) return <p className="loading-text">Loading quizzes...</p>;

  return (
    <div className="quiz-page">
      <h2 className="quiz-title">Choose A Quiz</h2>
      <div className="quiz-card-container">
        {quizData.map((card) => (
          <div key={card.language} className="quiz-card">
            <div className="quiz-card-header">{card.language}</div>
            <div className="quiz-card-content">
              <p>Questions: {card.questions}</p>
              <p>Time: {card.time} mins</p>
            </div>
            <button
              className="quiz-button"
              onClick={() => handleNavigate(card)}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Quiz;
