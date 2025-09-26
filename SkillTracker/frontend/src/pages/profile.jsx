import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/profile.css";
import { FaPen } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Table, Tag } from "antd"; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.post(
          "/api/v1/user/get_User_data",
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setUser(res.data.data);
        setFormData({ name: res.data.data.name, email: res.data.data.email });
      } catch (error) {
        console.error("Error fetching user data:", error.message);
        toast.error("Failed to load user data");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get("/api/v1/user/progress", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProgress(res.data.data);
      } catch (error) {
        console.error("Error fetching progress:", error.message);
        toast.error("Failed to load progress");
      }
    };
    fetchProgress();
  }, []);

  const handleUpdate = async () => {
    try {
      const res = await axios.put("/api/v1/user/update_profile", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUser(res.data.data);
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error.message);
      toast.error("Failed to update profile");
    }
  };

  const chartData = {
    labels: Object.keys(progress),
    datasets: [
      {
        label: "Correct Answers",
        data: Object.values(progress).map((p) => p.correct),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Total Questions",
        data: Object.values(progress).map((p) => p.total),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
    ],
  };

  const mockColumns = [
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
    },
    {
      title: "Completed",
      dataIndex: "completed",
      key: "completed",
      render: (completed) =>
        completed ? (
          <Tag color="green" style={{ border: "1px solid green" }}>
            Yes
          </Tag>
        ) : (
          <Tag color="red" style={{ border: "1px solid red" }}>
            No
          </Tag>
        ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("en-GB") : "N/A",
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        <div className="profile-container">
          <h2 className="profile-title">{formData.name} Profile</h2>

          {user ? (
            <div className="profile-card">
              <div className="avatar">
                {formData.name?.charAt(0).toUpperCase()}
              </div>
              {!editMode && (
                <FaPen
                  className="edit-icon"
                  onClick={() => setEditMode(true)}
                />
              )}
              {editMode ? (
                <>
                  <div className="input-group">
                    <label>Name:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="profile-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="profile-input"
                    />
                  </div>
                  <div className="edit-buttons">
                    <button className="save-btn" onClick={handleUpdate}>
                      Save
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>Profile ID:</strong> {user._id}
                  </p>
                  <p>
                    <strong>Name:</strong> {user.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(user.createdAt).toLocaleDateString()}{" "}
                    {new Date(user.createdAt).toLocaleTimeString()}
                  </p>
                  <p>
                    <strong>Last Updated:</strong>{" "}
                    {new Date(user.updatedAt).toLocaleDateString()}{" "}
                    {new Date(user.updatedAt).toLocaleTimeString()}
                  </p>
                  {user.isAdmin && (
                    <p>
                      <strong>Role:</strong> Admin
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="loading">Loading user data...</p>
          )}
        </div>
      </div>

      {Object.keys(progress).length > 0 && (
        <div className="big-stats-container">
          <h3>Quiz Progress by Language</h3>
          <Bar data={chartData} />
        </div>
      )}

      <div className="big-stats-container">
        {user?.completedMocks?.length > 0 && (
          <div className="completed-mocks">
            <h3>Completed Mock Tests</h3>
            <Table
              dataSource={user.completedMocks.map((m, index) => ({
                key: index,
                language: m.language,
                completed: m.completed,
                date: m.date,
              }))}
              columns={mockColumns}
              pagination={false}
              bordered
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
