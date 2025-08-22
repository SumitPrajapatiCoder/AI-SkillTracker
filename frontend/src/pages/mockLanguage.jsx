import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/mockLanguage.css";
import { toast } from "react-toastify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const MockLanguage = () => {
  const { language } = useParams();
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [mockDisabled, setMockDisabled] = useState(false);
  const [completionDate, setCompletionDate] = useState(null);
  const [user, setUser] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const navigate = useNavigate();
  const q = questions[current] || null;

  const certificateRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.post(
          `/api/v1/user/get_User_data`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUser(res.data.data);
      } catch (err) {
        console.error("Error fetching user:", err.message);
      }
    };
    fetchUser();
  }, []);

  const getMockStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const check = await axios.get(`/api/v1/user/mock-status/${language}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (check.data?.disable) {
        setMockDisabled(true);
        if (check.data.date) setCompletionDate(check.data.date);
        return { disable: true, date: check.data.date };
      } else {
        setMockDisabled(false);
        setCompletionDate(null);
        return { disable: false, date: null };
      }
    } catch (err) {
      console.error("Error checking mock status:", err);
      return { disable: false, date: null };
    }
  };

  useEffect(() => {
    const fetchMockQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        const status = await getMockStatus();

        if (status.disable) return;

        const res = await axios.get(`/api/v1/quiz/get-mock/${language}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const questionsData = res.data.data;
        setQuestions(questionsData);
        setTimer(questionsData.length * 60);
      } catch (err) {
        console.error("Fetch Error", err);
        toast.error("Error loading mock test");
      }
    };

    fetchMockQuestions();
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

  const handleAnswer = (selected) => {
    setSelectedOption(selected);
  };

  const handleNext = () => {
    if (selectedOption === q?.correctAnswer) {
      setScore((prev) => prev + 1);
    }
    setSelectedOption(null);
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setSelectedOption(null);
    }
  };

  const handleSubmit = async () => {
    let finalScore = score;
    if (selectedOption === q?.correctAnswer) {
      finalScore += 1;
    }

    setScore(finalScore);
    setCompleted(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/user/save-mock-result",
        { language, correct: finalScore, total: questions.length },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Mock submitted!");
      await getMockStatus();
    } catch (err) {
      toast.error("Failed to save mock result");
      console.error("Save mock result error:", err);
    }
  };

  const getHighlightedQuestion = (text) => {
    if (!text) return "";
    const cleanText = text.replace(/```[a-zA-Z0-9]*/g, "").replace(/```/g, "");
    return hljs.highlightAuto(cleanText).value;
  };

const handleDownloadManual = async () => {
  if (!certificateRef.current) {
    toast.error("Certificate not found.");
    return;
  }
  try {
    setPdfLoading(true);
    const element = certificateRef.current;
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

    pdf.save(`${user?.name || "user"}-${language}-certificate.pdf`);

    toast.success("Certificate downloaded successfully!");
  } catch (err) {
    console.error("Manual PDF download failed:", err);
    toast.error("Failed to download certificate.");
  } finally {
    setPdfLoading(false);
  }
};

 
  if (mockDisabled) {
    return (
      <div className="quiz-complete">
        <h2>🎉 Already Cleared</h2>
        <p>
          You’ve already scored full marks in the <strong>{language}</strong>{" "}
          mock test.
        </p>
        <button onClick={() => navigate("/mock_test")}>
          Go To Mack Page
        </button>

        <div
          className="certificate"
          ref={certificateRef}
          style={{
            maxWidth: 800,
            margin: "20px auto",
            padding: 24,
            border: "6px solid #d4af37",
            borderRadius: 12,
            textAlign: "center",
            background: "#fff",
            color: "#333",
            fontFamily: "'Georgia', serif, 'Times New Roman', Times, serif",
            userSelect: "none",
          }}
        >
          <h3 style={{ margin: 0 }}>🏆 Certificate of Excellence 🏆</h3>
          <p style={{ marginTop: 10 }}>This certifies that</p>
          <h2 className="user-name" style={{ margin: "10px 0" }}>
            {user?.name || "You"}
          </h2>
          <p style={{ marginBottom: 12 }}>
            has successfully completed the <strong>{language}</strong> mock test
            with full marks.
          </p>
          <p className="date" style={{ marginTop: 8 }}>
            Date:{" "}
            {completionDate
              ? new Date(completionDate).toLocaleDateString("en-IN")
              : "N/A"}
          </p>
        </div>

        <button
          onClick={handleDownloadManual}
          style={{ marginTop: 10 }}
          disabled={pdfLoading}
          aria-busy={pdfLoading}
        >
          {pdfLoading ? "Downloading..." : "Download Certificate"}
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="quiz-complete">
        <h2>Mock Test Completed!</h2>
        <p>
          You scored <strong>{score}</strong> out of{" "}
          <strong>{questions.length}</strong>
        </p>
        <button onClick={() => navigate("/mock_test")}>
          Go to Mock Text
        </button>
      </div>
    );
  }

  if (questions.length === 0) return <p>Loading mock questions...</p>;

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <div className="quiz-language-wrapper">
      <div className="question-box">
        <div className="quit">
          <button onClick={() => navigate("/mock_test")}>Quit</button>
        </div>
        <div className="timer">
          ⏱ Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </div>
        <pre>
          <strong>Q{current + 1}:</strong>{" "}
          <code
            dangerouslySetInnerHTML={{
              __html: getHighlightedQuestion(q?.question),
            }}
          />
        </pre>

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

export default MockLanguage;
