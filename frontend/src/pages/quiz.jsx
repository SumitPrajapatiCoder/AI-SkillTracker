import React from "react";
import { useNavigate } from "react-router-dom";
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
const quizData = [
  {
      id: "Java",
      name: "Java",
      icon: <FaJava className="quiz-icon java" />,
      questions: 30,
      time: "45 mins",
    },
    {
      id: "Python",
      name: "Python",
      icon: <FaPython className="quiz-icon python" />,
      questions: 25,
      time: "40 mins",
    },
    {
      id: "Javascript",
      name: "JavaScript",
      icon: <FaJs className="quiz-icon js" />,
      questions: 20,
      time: "35 mins",
    },
    {
      id: "SQL",
      name: "SQL",
      icon: <FaDatabase className="quiz-icon sql" />,
      questions: 15,
      time: "30 mins",
    },
    {
      id: "HTML",
      name: "HTML",
      icon: <FaHtml5 className="quiz-icon html" />,
      questions: 10,
      time: "20 mins",
    },
    {
      id: "React",
      name: "React",
      icon: <FaReact className="quiz-icon react" />,
      questions: 18,
      time: "30 mins",
    },
    {
      id: "CSS",
      name: "CSS",
      icon: <FaCss3 className="quiz-icon css" />,
      questions: 12,
      time: "25 mins",
    },
    {
      id: "Cpp",
      name: "C++",
      icon: <SiCplusplus className="quiz-icon cpp" />,
      questions: 22,
      time: "40 mins",
    },
    {
      id: "C",
      name: "C",
      icon: <SiC className="quiz-icon c" />,
      questions: 20,
      time: "35 mins",
    },
    {
      id: "MySQL",
      name: "MySQL",
      icon: <SiMysql className="quiz-icon mysql" />,
      questions: 15,
      time: "30 mins",
    }
];


function Quiz() {
  const navigate = useNavigate();

  const handleClick = (id) => {
    navigate(`/quiz/${id}`);
  };

  return (
    <div className="quiz-page">
      <h2 className="quiz-title">Choose a Quiz</h2>
      <div className="quiz-card-container">
        {quizData.map((quiz) => (
          <div
            className="quiz-card"
            key={quiz.id}
            onClick={() => handleClick(quiz.id)}
          >
            {quiz.icon}
            <h3>{quiz.name}</h3>
            <p>Questions: {quiz.questions}</p>
            <p>Time: {quiz.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Quiz;
