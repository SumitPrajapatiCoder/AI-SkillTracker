import React, { useEffect, useState } from "react";
import axios from "axios";
import StudyPlanText from "./studyText";
import { toast } from "react-toastify";
import "../styles/study_plane.css";

const StudyPlan = () => {
  const [studyPlansByLanguage, setStudyPlansByLanguage] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingLang, setGeneratingLang] = useState(null);
  const [savingLang, setSavingLang] = useState(null);
  const [savedPlans, setSavedPlans] = useState(new Set());

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/v1/user/study-plan", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) {
          const plans = res.data.studyPlansByLanguage || {};
          setStudyPlansByLanguage(plans);
          setSavedPlans(new Set(Object.keys(plans)));
        } else {
          setError("Failed to fetch study plans");
        }
      } catch (e) {
        setError(e.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const completedQuizzes =
      JSON.parse(localStorage.getItem("completedQuizzes")) || [];
    if (completedQuizzes.length > 0) {
      completedQuizzes.forEach((lang) => handleGenerate(lang));
      localStorage.setItem("completedQuizzes", JSON.stringify([])); 
    }
  }, []);

  const handleGenerate = async (language) => {
    setGeneratingLang(language);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/v1/user/study-plan?language=${encodeURIComponent(language)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setStudyPlansByLanguage((prev) => ({
          ...prev,
          [language]: res.data.studyPlan,
        }));
        setSavedPlans((prev) => {
          const updated = new Set(prev);
          updated.delete(language);
          return updated;
        });
        toast.success(`Generated new study plan for ${language}`);
      } else {
        toast.error(`Failed to generate study plan for ${language}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error generating study plan");
    } finally {
      setGeneratingLang(null);
    }
  };

  const handleSave = async (language) => {
    setSavingLang(language);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/v1/user/study-plan/save",
        { language, studyPlan: studyPlansByLanguage[language] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Study plan saved for ${language}`);
        setSavedPlans((prev) => new Set(prev).add(language));
      } else {
        toast.error(`Failed to save study plan for ${language}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error saving study plan");
    } finally {
      setSavingLang(null);
    }
  };

  if (loading)
    return <div className="loading">Loading your study plans...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="study-plan-container">
      <h1>Your Personalized Study Plans</h1>
      {Object.keys(studyPlansByLanguage).length === 0 && (
        <p>No study plans found yet.</p>
      )}

      {Object.entries(studyPlansByLanguage).map(([language, plan]) => (
        <section key={language} className="language-section">
          <h2>{language} Study Plan</h2>
          {plan ? (
            <>
              <StudyPlanText studyPlan={plan} />
              <div className="button-group">
                <button
                  onClick={() => handleGenerate(language)}
                  disabled={generatingLang === language}
                >
                  {generatingLang === language
                    ? "Generating..."
                    : "Regenerate Plan"}
                </button>
                <button
                  onClick={() => handleSave(language)}
                  disabled={savingLang === language || savedPlans.has(language)}
                >
                  {savingLang === language
                    ? "Saving..."
                    : savedPlans.has(language)
                    ? "Saved"
                    : "Save Plan"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p>No study plan generated yet.</p>
              <button
                onClick={() => handleGenerate(language)}
                disabled={generatingLang === language}
              >
                {generatingLang === language
                  ? "Generating..."
                  : "Generate Plan"}
              </button>
            </>
          )}
        </section>
      ))}
    </main>
  );
};

export default StudyPlan;
