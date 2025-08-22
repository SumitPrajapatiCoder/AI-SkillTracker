import React from "react";
import { useNavigate } from "react-router-dom";
import { FaJava, FaPython, FaJs, FaDatabase, FaHtml5, FaReact, FaCss3 } from "react-icons/fa";
import { SiCplusplus, SiC,SiMysql } from "react-icons/si";

import "../styles/mock_test.css";

const mockTestData = [
  {
    id: "Java",
    name: "Java",
    icon: <FaJava className="mock-icon java" />,
    questions: 30,
    time: "45 mins",
  },
  {
    id: "Python",
    name: "Python",
    icon: <FaPython className="mock-icon python" />,
    questions: 25,
    time: "40 mins",
  },
  {
    id: "Javascript",
    name: "JavaScript",
    icon: <FaJs className="mock-icon js" />,
    questions: 20,
    time: "35 mins",
  },
  {
    id: "SQL",
    name: "SQL",
    icon: <FaDatabase className="mock-icon sql" />,
    questions: 15,
    time: "30 mins",
  },
  {
    id: "HTML",
    name: "HTML",
    icon: <FaHtml5 className="mock-icon html" />,
    questions: 10,
    time: "20 mins",
  },
  {
    id: "React",
    name: "React",
    icon: <FaReact className="mock-icon react" />,
    questions: 18,
    time: "30 mins",
  },
  {
    id: "CSS",
    name: "CSS",
    icon: <FaCss3 className="mock-icon css" />,
    questions: 12,
    time: "25 mins",
  },
  {
    id: "Cpp",
    name: "Cpp",
    icon: <SiCplusplus className="mock-icon cpp" />,
    questions: 22,
    time: "40 mins",
  },
  {
    id: "C",
    name: "C",
    icon: <SiC className="mock-icon c" />,
    questions: 20,
    time: "35 mins",
  },
  {
    id: "MySQL",
    name: "MySQL",
    icon: <SiMysql className="mock-icon mysql" />,
    questions: 15,
    time: "30 mins",
  },
];

const MockTest = () => {
  const navigate = useNavigate();

  const handleClick = (id) => {
    navigate(`/mock_test/${id}`);
  };

  return (
    <div className="mocktest-page">
      <h2 className="mocktest-title">Mock Tests</h2>
      <div className="mocktest-cards">
        {mockTestData.map((test) => (
          <div
            key={test.id}
            className="mocktest-card"
            onClick={() => handleClick(test.id)}
          >
            {test.icon}
            <h3>{test.name}</h3>
            <p>{test.questions} Questions</p>
            <p>Time : {test.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockTest;
