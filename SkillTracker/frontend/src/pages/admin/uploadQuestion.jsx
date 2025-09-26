import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/uploadQuestion.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminUpload = () => {
  const [type, setType] = useState("quiz");
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [languages, setLanguages] = useState([]);


  const [showLangForm, setShowLangForm] = useState(false);
  const [newLang, setNewLang] = useState("");

  const difficulties = ["Easy", "Medium", "Hard"];

  
  const fetchLanguages = async () => {
    try {
       const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/admin/get-languages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLanguages(res.data.data);
    } catch (err) {
      console.error("Fetch Languages Error:", err);
      toast.error("Failed to load languages");
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handleUploadLanguage = async (e) => {
    e.preventDefault();
    if (!newLang.trim()) {
      toast.error("Language name required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/admin/upload-language",
        { name: newLang.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Language uploaded!");
      setNewLang("");
      setShowLangForm(false);
      fetchLanguages();
    } catch (err) {
      console.error("Upload Language Error:", err);
      toast.error(err.response?.data?.message || "Failed to upload language");
    }
  };

  const handleGenerateAI = async () => {
    if (!language || !difficulty) {
      toast.error("Please select both language and difficulty");
      return;
    }
    try {
      setLoadingAI(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/v1/admin/generate-ai",
        { language, difficulty, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const {
        question: aiQuestion,
        options: aiOptions,
        correctAnswer: aiCorrect,
      } = res.data.data;

      setQuestion(aiQuestion);
      setOptions(aiOptions);
      setCorrectAnswer(aiCorrect);
      toast.success("AI-generated question loaded!");
    } catch (err) {
      console.error("AI Generation Error:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Unknown error while generating AI question."
      );
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/admin/upload-question",
        { type, language, difficulty, question, options, correctAnswer },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Question uploaded!");
      setLanguage("");
      setDifficulty("");
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }
  };

  return (
    <div className="container">
      <button type="button" onClick={handleGenerateAI} disabled={loadingAI}>
        {loadingAI ? "Generating..." : "Generate with AI"}
      </button>
      
      <div className="upload-language-section">
        <button
          type="button"
          onClick={() => setShowLangForm(!showLangForm)}
          className="toggle-btn"
        >
          {showLangForm ? "Cancel" : "Upload Language"}
        </button>

        {showLangForm && (
          <form onSubmit={handleUploadLanguage} className="lang-form">
            <input
              type="text"
              placeholder="Enter new language"
              value={newLang}
              onChange={(e) => setNewLang(e.target.value)}
              required
            />
            <button type="submit">Add Language</button>
          </form>
        )}
      </div>

      <h2>Upload {type === "quiz" ? "Quiz" : "Mock"} Question</h2>

      <form onSubmit={handleSubmit}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="quiz">Quiz</option>
          <option value="mock">Mock</option>
        </select>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
        >
          <option value="">Select Language</option>
          {languages.map((lang) => (
            <option key={lang._id} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>

        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          required
        >
          <option value="">Select Difficulty</option>
          {difficulties.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <label>Enter Question</label>
        <textarea
          placeholder="Enter Question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <label>Enter Options</label>
        <div className="options-grid">
          {options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={`Option ${idx + 1}`}
              value={opt}
              onChange={(e) => {
                const updated = [...options];
                updated[idx] = e.target.value;
                setOptions(updated);
              }}
              required
            />
          ))}
        </div>

        <label>Enter Correct Answer</label>
        <input
          type="text"
          placeholder="Correct Answer"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          required
        />

        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default AdminUpload;
