import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaJava,
  FaPython,
  FaJs,
  FaDatabase,
  FaHtml5,
  FaReact,
  FaCss3,
} from "react-icons/fa";
import { SiCplusplus, SiC, SiMysql } from "react-icons/si";
import "../styles/quiz.css";

const iconMap = {
  Java: <FaJava className="quiz-icon java" />,
  Python: <FaPython className="quiz-icon python" />,
  Javascript: <FaJs className="quiz-icon js" />,
  SQL: <FaDatabase className="quiz-icon sql" />,
  HTML: <FaHtml5 className="quiz-icon html" />,
  React: <FaReact className="quiz-icon react" />,
  CSS: <FaCss3 className="quiz-icon css" />,
  Cpp: <SiCplusplus className="quiz-icon cpp" />,
  C: <SiC className="quiz-icon c" />,
  MySQL: <SiMysql className="quiz-icon mysql" />,
};

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

  const handleClick = (card) => {
    navigate(`/quiz/${card.language}`, {
      state: { cardQuestions: card.questions, cardTime: card.time },
    });
  };

  if (loading) return <p>Loading quizzes...</p>;

  return (
    <div className="quiz-page">
      <h2 className="quiz-title">Choose a Quiz</h2>
      <div className="quiz-card-container">
        {quizData.map((card) => (
          <div
            key={card.language}
            className="quiz-card"
            onClick={() => handleClick(card)}
          >
            {iconMap[card.language] || <FaDatabase className="quiz-icon" />}
            <h3>{card.language}</h3>
            <p>Questions: {card.questions}</p>
            <p>Time: {card.time} mins</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Quiz;
