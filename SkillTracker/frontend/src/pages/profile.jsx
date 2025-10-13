import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/profile.css";
import { FaPen, FaCamera, FaTrophy } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bar, Line } from "react-chartjs-2";
import defaultAvatar from "../assets/default-avatar.png";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement, LineElement
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

import { Table, Tag } from "antd";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);


const Profile = () => {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [mockList, setMockList] = useState([]);
  const [contestProgress, setContestProgress] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.post(
          "/api/v1/user/get_User_data",
          {},
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setUser(res.data.data);
        setFormData({ name: res.data.data.name, email: res.data.data.email });
      } catch {
        toast.error("Failed to load user data");
      }
    };
    fetchUser();
  }, []);


  useEffect(() => {
    const fetchUserRank = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get("/api/v1/user/user-rank", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success && data.userRank) {
          setUserRank(data.userRank);
        }
      } catch (err) {
        console.error("Failed to fetch user rank:", err);
      }
    };
    fetchUserRank();
  }, []);



  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await axios.get("/api/v1/user/progress", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProgress(res.data.data || {});
      } catch {
        toast.error("Failed to load progress");
      }
    };
    fetchProgress();
  }, []);


  useEffect(() => {
    const fetchMockList = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/v1/user/get-mock-cards", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mocks = res.data.data.map((m) => {
          const completedMock = user?.completedMocks?.find(
            (cm) => cm.language === m.language
          );
          return {
            language: m.language,
            completed: !!completedMock,
            date: completedMock?.date || "",
          };
        });
        setMockList(mocks);
      } catch {
        toast.error("Failed to load mock tests");
        setMockList([]);
      }
    };
    if (user) fetchMockList();
  }, [user]);


  useEffect(() => {
    const fetchContestProgress = async () => {
      try {
        const res = await axios.get("/api/v1/user/progress-contest", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setContestProgress(res.data.data || []);

      } catch {
        toast.error("Failed to load contest progress");
      }
    };
    fetchContestProgress();
  }, []);


  const handleUpdate = async () => {
    try {
      const res = await axios.put("/api/v1/user/update_profile", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUser(res.data.data);
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    }
  };


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }
    const formData = new FormData();
    formData.append("image", selectedFile);
    try {
      const res = await axios.put("/api/v1/user/upload_profile_image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUser(res.data.data);
      setPreviewImage(null);
      setSelectedFile(null);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const handleDeleteImage = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete your profile image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await axios.delete("/api/v1/user/delete_profile_image", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUser(res.data.data);
      toast.success("Profile image deleted!");
      MySwal.fire("Deleted!", "Your profile image has been removed.", "success");
    } catch {
      toast.error("Failed to delete image");
    }
  };

  const chartData = {
    labels: Object.keys(progress),
    datasets: [
      {
        label: "Correct Answers",
        data: Object.values(progress).map((p) => p.correct),
        backgroundColor: "#6366f1",
      },
      {
        label: "Total Questions",
        data: Object.values(progress).map((p) => p.total),
        backgroundColor: "#a855f7",
      },
    ],
  };

  const mockColumns = [
    { title: "Language", dataIndex: "language", key: "language" },
    {
      title: "Completed",
      dataIndex: "completed",
      key: "completed",
      render: (completed) =>
        completed ? (
          <Tag color="green">Yes</Tag>
        ) : (
          <Tag color="red">No</Tag>
        ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("en-GB") : "Not completed",
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-main">
        {userRank && (
          <div className="user-rank">
            <h3><FaTrophy style={{ marginRight: "6px" }} /> Your Rank</h3>
            <p>
              <strong>Rank:</strong> {userRank.rank} | <strong>Name:</strong> {userRank.name} | <strong>Total Score:</strong> {userRank.totalScore}
            </p>
          </div>
        )}

        <div className="profile-header">
          <div className="avatar-wrapper">
            <img
              src={user?.profileImage || defaultAvatar}
              alt="Profile"
              className="profile-img"
            />
            <label htmlFor="file-upload" className="camera-icon">
              <FaCamera />
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
          <h2>{formData.name || "User"}'s Profile</h2>
          <p className="user-email">{formData.email}</p>
        </div>

        {previewImage && (
          <div className="preview-section">
            <img src={previewImage} alt="Preview" />
            <button onClick={handleImageUpload} className="save-btn">
              Upload
            </button>
          </div>
        )}

        <div className="profile-info">
          {!editMode ? (
            <>
              <p><strong>Profile ID:</strong> {user?._id}</p>
              <p><strong>Joined:</strong> {new Date(user?.createdAt).toLocaleDateString("en-GB")} </p>
              <p><strong>Last Updated:</strong> {new Date(user?.updatedAt).toLocaleDateString("en-GB")}</p>
              {user?.isAdmin && <p><strong>Role:</strong> Admin</p>}
              <button className="edit-profile-btn" onClick={() => setEditMode(true)}>
                <FaPen /> Edit Profile
              </button>
            </>
          ) : (
            <div className="edit-section">
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="profile-input"
                placeholder="Enter Name"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="profile-input"
                placeholder="Enter Email"
              />
              <div className="edit-buttons">
                <button className="save-btn" onClick={handleUpdate}>
                  Save
                </button>
                <button className="cancel-btn" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
                {user?.profileImage && (
                  <button className="delete-btn" onClick={handleDeleteImage}>
                    Delete Image
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="stats-section">
          <h3>Quiz Progress</h3>
          {Object.keys(progress).length ? (
            <Bar data={chartData} />
          ) : (
            <p className="no-data">No quiz data yet.</p>
          )}
        </div>

        <div className="stats-section">
          <h3>Contest Progress Over Time</h3>
          {contestProgress.length > 0 ? (
            <Line
              data={{
                labels: contestProgress.map((_, i) => `Contest ${i + 1}`),
                datasets: [
                  {
                    label: "Contest Score (%)",
                    data: contestProgress.map((c) => c.percentage),
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.3)",
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: "#1d4ed8",
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        const idx = context.dataIndex;
                        const c = contestProgress[idx];
                        console.log(c); 
                        return [
                          `Contest Id: ${c.contestId}`,
                          `Score: ${c.score}/${c.totalQuestions}`,
                          `Percentage: ${c.percentage}%`,
                          `Date: ${new Date(c.date).toLocaleDateString("en-GB")}`,
                        ];
                      }

                    },
                  },
                  title: {
                    display: true,
                    text: "Your Contest Performance Trend",
                  },
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: "Percentage (%)" },
                  },
                  x: { title: { display: true, text: "Contest" } },
                },
              }}
            />
          ) : (
            <p className="no-data">No valid contest data yet.</p>
          )}
        </div>



        <div className="mock-section">
          <h3>Mock Test Summary</h3>
          {mockList.length ? (
            <Table
              dataSource={mockList.map((m, i) => ({ key: i, ...m }))}
              columns={mockColumns}
              pagination={false}
              bordered
            />
          ) : (
            <p className="no-data">No mock tests found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
