import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import "../styles/contest.css";

const Contest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contest, setContest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/v1/user/contest/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          const c = res.data.contest;
          setContest(c);
          setQuestions(c.questions || []);
          setTimer(c.timeDuration * 60);
        } else {
          toast.error(res.data.message);
        }
      } catch (err) {
        console.error("Error fetching contest:", err);
        toast.error(err.response?.data?.message || "Failed to load contest.");
      }
    };

    fetchContest();
  }, [id]);

  useEffect(() => {
    if (!contest || completed) return;

    intervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [contest, completed]);

  useEffect(() => {
    if (completed && questions.length > 0) {
      clearInterval(intervalRef.current);
      handleSubmit();
    }
  }, [completed]);

  const handleAnswer = (selected) => {
    setAnswers((prev) => ({ ...prev, [current]: selected }));
  };

  const handleSubmit = async () => {
    const correctCount = questions.reduce(
      (acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0),
      0
    );

    const playedQuestions = questions.map((q, idx) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      selectedAnswer: answers[idx] || null,
    }));

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/user/contestSubmit",
        {
          contestId: contest._id,
          score: correctCount,
          totalQuestions: questions.length,
          playedQuestions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Contest submitted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save contest result");
    }
  };

  const handleNext = () => {
    setCurrent((prev) => {
      const next = prev + 1;
      if (next < questions.length) return next;
      else {
        setCompleted(true);
        return prev;
      }
    });
  };

  const handlePrevious = () => {
    if (current > 0) setCurrent((prev) => prev - 1);
  };

  if (!contest)
    return <p className="contest-page-loading">Loading contest...</p>;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  if (completed) {
    return (
      <section className="contest-page-complete">
        <h3>Your contest has been submitted successfully!</h3>
        <p>Results will be visible once the leaderboard is published.</p>
        <button
          className="contest-page-back-btn"
          onClick={() => navigate("/contestList")}
        >
          Back to Contests
        </button>
      </section>
    );
  }

  const q = questions[current];
  const highlightedHTML = hljs.highlightAuto(q.question).value;
  const selectedOption = answers[current] || null;

  return (
    <section className="contest-page-wrapper">
      <header className="contest-page-header">
        <button
          className="contest-page-quit-btn"
          onClick={() => navigate("/contestList")}
        >
          Quit
        </button>
        ⏱ Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </header>

      <article className="contest-page-question-box">
        <pre className="contest-page-question-text">
          Q{current + 1}:{" "}
          <code dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
        </pre>

        <div className="contest-page-options-list">
          {q.options.map((opt, idx) => {
            const highlightedOpt = hljs.highlightAuto(opt).value;
            const isSelected = selectedOption === opt;

            return (
              <label
                key={idx}
                className={`contest-page-option-item ${isSelected ? "contest-page-selected-option" : ""
                  }`}
              >
                <input
                  type="radio"
                  name={`question-${current}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => handleAnswer(opt)}
                />
                <pre className="contest-page-option-code">
                  <code dangerouslySetInnerHTML={{ __html: highlightedOpt }} />
                </pre>
              </label>
            );
          })}
        </div>

        <div className="contest-page-navigation-buttons">
          <button
            className="contest-page-nav-btn"
            onClick={handlePrevious}
            disabled={current === 0}
          >
            Previous
          </button>
          <button className="contest-page-nav-btn" onClick={handleNext}>
            {current === questions.length - 1 ? "Submit" : "Next"}
          </button>
        </div>
      </article>
    </section>
  );
};

export default Contest;
