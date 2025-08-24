import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/listCardDetails.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaPen } from "react-icons/fa";

const MySwal = withReactContent(Swal);

const ListCardDetails = () => {
  const [cards, setCards] = useState([]);
  const [type, setType] = useState("quiz");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchCards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url =
        type === "quiz"
          ? "/api/v1/admin/get-quiz-cards"
          : "/api/v1/admin/get-mock-cards";

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.data || [];
      const filteredData = search
        ? data.filter((c) =>
            c.language.toLowerCase().includes(search.toLowerCase())
          )
        : data;

      setCards(filteredData);
    } catch (err) {
      console.error("Fetch Cards Error:", err.response?.data || err.message);
      toast.error("Failed to load card details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [type, search]);

  const handleDelete = async (id) => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this card?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/v1/admin/delete-card/${id}?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards((prev) => prev.filter((c) => c._id !== id));
      toast.success("Card deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const startEdit = (card) => {
    setEditMode(card._id);
    setEditForm({
      language: card.language || "",
      questions: card.questions || "",
      time: card.time || "",
    });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/v1/admin/update-card/${editMode}?type=${type}`,
        editForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCards((prev) =>
        prev.map((c) => (c._id === editMode ? { ...c, ...editForm } : c))
      );
      toast.success("Card updated successfully!");
      setEditMode(null);
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  return (
    <div className="list-card-container">
      <h2>All {type === "quiz" ? "Quiz" : "Mock"} Cards</h2>

      <div className="filter-bar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="quiz">Quiz</option>
          <option value="mock">Mock</option>
        </select>

        <input
          type="text"
          placeholder="Search by language"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={fetchCards} disabled={loading}>
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {cards.length === 0 ? (
        <p>No {type === "quiz" ? "Quiz" : "Mock"} cards found.</p>
      ) : (
        <div className="card-grid">
          {cards.map((card) => (
            <div
              key={card._id}
              className="card"
              style={{ position: "relative" }}
            >
              {editMode === card._id ? (
                <>
                  <input
                    type="text"
                    value={editForm.language}
                    onChange={(e) =>
                      setEditForm({ ...editForm, language: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    value={editForm.questions}
                    onChange={(e) =>
                      setEditForm({ ...editForm, questions: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    value={editForm.time}
                    onChange={(e) =>
                      setEditForm({ ...editForm, time: e.target.value })
                    }
                  />
                  <div className="edit-buttons">
                    <button onClick={handleUpdate} className="save-btn">
                      Save
                    </button>
                    <button
                      onClick={() => setEditMode(null)}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <FaPen
                    onClick={() => startEdit(card)}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      cursor: "pointer",
                      color: "#007bff",
                    }}
                  />
                  <h3>{card.language}</h3>
                  <p>Questions: {card.questions}</p>
                  <p>Time: {card.time} minutes</p>
                  <div className="card-actions">
                    <button
                      onClick={() => handleDelete(card._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListCardDetails;
