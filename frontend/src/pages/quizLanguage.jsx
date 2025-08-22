import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/quizlanguage.css";
import { toast } from "react-toastify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

const QuizLanguage = () => {
  const { language } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

 
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/v1/quiz/get-quiz/${language}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const questionsData = res.data.data;
        setQuestions(questionsData);
        setTimer(questionsData.length * 60);
      } catch (err) {
        console.error("Fetch Error", err);
        toast.error(`No quiz found for ${language}`);
      }
    };
    fetchQuestions();
  }, [language]);

  useEffect(() => {
    if (!completed && questions.length > 0 && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, completed, questions]);

  const handleAnswer = (selected) => setSelectedOption(selected);

  const handleNext = () => {
    if (selectedOption === questions[current].correctAnswer) {
      setScore((prev) => prev + 1);
    }
    setSelectedOption(null);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setSelectedOption(null);
    }
  };


  const handleSubmit = async () => {
    const finalScore =
      score + (selectedOption === questions[current].correctAnswer ? 1 : 0);

    setCompleted(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/user/save-quiz-result",
        { language, correct: finalScore, total: questions.length },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Quiz submitted!");

      const completedQuizzes =
        JSON.parse(localStorage.getItem("completedQuizzes")) || [];
      if (!completedQuizzes.includes(language)) {
        completedQuizzes.push(language);
        localStorage.setItem(
          "completedQuizzes",
          JSON.stringify(completedQuizzes)
        );
      }
    } catch (err) {
      toast.error("Failed to save result", err);
    }
  };


  if (completed) {
    return (
      <div className="quiz-complete">
        <h2>Quiz Completed!</h2>
        <p>
          You scored <strong>{score}</strong> out of{" "}
          <strong>{questions.length}</strong>
        </p>
        <button
          onClick={() =>
            navigate("/study_plane", {
              state: { generateLanguage: language },
              replace: true, 
            })
          }
        >
          Go to Study Plan
        </button>

        <button
          onClick={() =>
            navigate("/roadmap", {
              state: { generateLanguage: language },
              replace: true,
            })
          }
        >
          Go to Road Map
        </button>
      </div>
    );
  }

  if (questions.length === 0) return <p>Loading questions...</p>;

  const q = questions[current];
  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const cleanQuestion = q.question
    .replace(/\n[a-zA-Z]*/g, "")
    .replace(/\n/g, "");
  const highlightedHTML = hljs.highlightAuto(cleanQuestion).value;

  return (
    <div className="quiz-language-wrapper">
      <div className="question-box">
        <div className="quit">
          <button onClick={() => navigate("/quiz")}>Quit</button>
        </div>
        <div className="timer">
          ⏱ Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>

        <pre>
          Q{current + 1}:{" "}
          <code dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
        </pre>

        {/* <div className="options-list">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              className={selectedOption === opt ? "selected" : ""}
            >
              {opt}
            </button>
          ))}
        </div> */}

        <div className="options-list">
          {q.options.map((opt, idx) => {
            const cleanedOpt = opt.replace(/\n[a-zA-Z]*/g, "").trim();
            const highlightedOpt = hljs.highlightAuto(cleanedOpt).value;

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className={selectedOption === opt ? "selected" : ""}
              >
                <pre className="option-code">
                  <code dangerouslySetInnerHTML={{ __html: highlightedOpt }} />
                </pre>
              </button>
            );
          })}
        </div>

        <div className="navigation-buttons">
          <button onClick={handlePrevious} disabled={current === 0}>
            Previous
          </button>
          <button onClick={handleNext}>
            {current === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizLanguage;

