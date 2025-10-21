// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import RoadMapText from "./roadText";
// import { toast } from "react-toastify";
// import "../styles/roadmap.css";

// const Roadmap = () => {
//   const [roadmapByLanguage, setRoadmapByLanguage] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [generatingLang, setGeneratingLang] = useState(null);
//   const [savingLang, setSavingLang] = useState(null);
//   const [savedRoadmaps, setSavedRoadmaps] = useState(new Set());

//   useEffect(() => {
//     fetchRoadmaps();
//   }, []);

//   const fetchRoadmaps = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get("/api/v1/user/roadmap", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (res.data.success) {
//         const roadmaps = res.data.roadmapByLanguage || {};
//         setRoadmapByLanguage(roadmaps);
//         setSavedRoadmaps(new Set(Object.keys(roadmaps)));
//       } else {
//         setError("Failed to fetch roadmaps");
//       }
//     } catch (e) {
//       setError(e.response?.data?.message || "Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const completedForRoadmap =
//       JSON.parse(localStorage.getItem("completedQuizzesForRoadmap")) || [];
//     if (completedForRoadmap.length > 0) {
//       completedForRoadmap.forEach((lang) => handleGenerate(lang));
//       localStorage.setItem("completedQuizzesForRoadmap", JSON.stringify([]));
//     }
//   }, []);
  

//   const handleGenerate = async (language) => {
//     setGeneratingLang(language);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(
//         `/api/v1/user/roadmap?language=${encodeURIComponent(language)}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.success) {
//         setRoadmapByLanguage((prev) => ({
//           ...prev,
//           [language]: res.data.roadmap,
//         }));
//         setSavedRoadmaps((prev) => {
//           const updated = new Set(prev);
//           updated.delete(language);
//           return updated;
//         });
//         toast.success(`Generated roadmap for ${language}`);
//       } else {
//         toast.error(`Failed to generate roadmap for ${language}`);
//       }
//     } catch (e) {
//       toast.error(e.response?.data?.message || "Error generating roadmap");
//     } finally {
//       setGeneratingLang(null);
//     }
//   };

//   const handleSave = async (language) => {
//     setSavingLang(language);
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.post(
//         "/api/v1/user/roadmap/save",
//         { language, roadmap: roadmapByLanguage[language] },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.success) {
//         toast.success(`Roadmap saved for ${language}`);
//         setSavedRoadmaps((prev) => new Set(prev).add(language));
//       } else {
//         toast.error(`Failed to save roadmap for ${language}`);
//       }
//     } catch (e) {
//       toast.error(e.response?.data?.message || "Error saving roadmap");
//     } finally {
//       setSavingLang(null);
//     }
//   };

//   if (loading) return <div className="loading">Loading roadmaps...</div>;
//   if (error) return <div className="error">{error}</div>;

//   return (
//     <main className="roadmap-container">
//       <h1>Your Personalized Roadmaps</h1>

//       {Object.keys(roadmapByLanguage).length === 0 ? (
//         <p className="no-roadmaps">No roadmaps found.</p>
//       ) : (
//         Object.entries(roadmapByLanguage).map(([language, roadmap]) => (
//           <section key={language} className="language-section">
//             <h2>{language} Roadmap</h2>

//             {roadmap ? (
//               <>
//                 <RoadMapText raodMap={roadmap} />
//                 <div className="button-group">
//                   <button
//                     onClick={() => handleGenerate(language)}
//                     disabled={generatingLang === language}
//                   >
//                     {generatingLang === language
//                       ? "Generating..."
//                       : "Regenerate Roadmap"}
//                   </button>
//                   <button
//                     onClick={() => handleSave(language)}
//                     disabled={
//                       savingLang === language || savedRoadmaps.has(language)
//                     }
//                   >
//                     {savingLang === language
//                       ? "Saving..."
//                       : savedRoadmaps.has(language)
//                       ? "Saved"
//                       : "Save Roadmap"}
//                   </button>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <p>No roadmap generated yet.</p>
//                 <button
//                   onClick={() => handleGenerate(language)}
//                   disabled={generatingLang === language}
//                 >
//                   {generatingLang === language
//                     ? "Generating..."
//                     : "Generate Roadmap"}
//                 </button>
//               </>
//             )}
//           </section>
//         ))
//       )}
//     </main>
//   );
// };

// export default Roadmap;





























import React, { useEffect, useState } from "react";
import axios from "axios";
import RoadMapText from "./roadText";
import { toast } from "react-toastify";
import "../styles/roadmap.css";
import { FaSearch } from "react-icons/fa"; 

const Roadmap = () => {
  const [roadmapByLanguage, setRoadmapByLanguage] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingLang, setGeneratingLang] = useState(null);
  const [savingLang, setSavingLang] = useState(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState(""); 

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/user/roadmap", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const roadmaps = res.data.roadmapByLanguage || {};
        setRoadmapByLanguage(roadmaps);
        setSavedRoadmaps(new Set(Object.keys(roadmaps)));
      } else {
        setError("Failed to fetch roadmaps");
      }
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const completedForRoadmap =
      JSON.parse(localStorage.getItem("completedQuizzesForRoadmap")) || [];
    if (completedForRoadmap.length > 0) {
      completedForRoadmap.forEach((lang) => handleGenerate(lang));
      localStorage.setItem(
        "completedQuizzesForRoadmap",
        JSON.stringify([])
      );
    }
  }, []);

  const handleGenerate = async (language) => {
    setGeneratingLang(language);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/v1/user/roadmap?language=${encodeURIComponent(language)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setRoadmapByLanguage((prev) => ({
          ...prev,
          [language]: res.data.roadmap,
        }));
        setSavedRoadmaps((prev) => {
          const updated = new Set(prev);
          updated.delete(language);
          return updated;
        });
        toast.success(`Generated roadmap for ${language}`);
      } else {
        toast.error(`Failed to generate roadmap for ${language}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error generating roadmap");
    } finally {
      setGeneratingLang(null);
    }
  };

  const handleSave = async (language) => {
    setSavingLang(language);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/v1/user/roadmap/save",
        { language, roadmap: roadmapByLanguage[language] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success(`Roadmap saved for ${language}`);
        setSavedRoadmaps((prev) => new Set(prev).add(language));
      } else {
        toast.error(`Failed to save roadmap for ${language}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Error saving roadmap");
    } finally {
      setSavingLang(null);
    }
  };

  const filteredLanguages = Object.keys(roadmapByLanguage).filter((lang) =>
    lang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="loading">Loading roadmaps...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <main className="roadmap-container">
      <h1>Your Personalized Roadmaps</h1>

      <div className="search-bar">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by language..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredLanguages.length === 0 && (
        <p>No roadmaps found for "{searchQuery}".</p>
      )}

      {filteredLanguages.map((language) => {
        const roadmap = roadmapByLanguage[language];
        return (
          <section key={language} className="language-section">
            <h2>{language} Roadmap</h2>

            {roadmap ? (
              <>
                <RoadMapText raodMap={roadmap} />
                <div className="button-group">
                  <button
                    onClick={() => handleGenerate(language)}
                    disabled={generatingLang === language}
                  >
                    {generatingLang === language
                      ? "Generating..."
                      : "Regenerate Roadmap"}
                  </button>
                  <button
                    onClick={() => handleSave(language)}
                    disabled={
                      savingLang === language || savedRoadmaps.has(language)
                    }
                  >
                    {savingLang === language
                      ? "Saving..."
                      : savedRoadmaps.has(language)
                        ? "Saved"
                        : "Save Roadmap"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>No roadmap generated yet.</p>
                <button
                  onClick={() => handleGenerate(language)}
                  disabled={generatingLang === language}
                >
                  {generatingLang === language
                    ? "Generating..."
                    : "Generate Roadmap"}
                </button>
              </>
            )}
          </section>
        );
      })}
    </main>
  );
};

export default Roadmap;
