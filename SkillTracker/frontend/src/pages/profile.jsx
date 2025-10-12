// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import "../styles/profile.css";
// import { FaPen, FaCamera } from "react-icons/fa";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { Bar } from "react-chartjs-2";
// import defaultAvatar from "../assets/default-avatar.png";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import { Table, Tag } from "antd";
// import Swal from "sweetalert2";
// import withReactContent from "sweetalert2-react-content";

// const MySwal = withReactContent(Swal);
// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);



// const Profile = () => {
//   const [user, setUser] = useState(null);
//   const [progress, setProgress] = useState({});
//   const [mockList, setMockList] = useState([]);
//   const [editMode, setEditMode] = useState(false);
//   const [formData, setFormData] = useState({ name: "", email: "" });


//   const [selectedFile, setSelectedFile] = useState(null);
//   const [previewImage, setPreviewImage] = useState(null);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const res = await axios.post(
//           "/api/v1/user/get_User_data",
//           {},
//           { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
//         );
//         setUser(res.data.data);
//         setFormData({ name: res.data.data.name, email: res.data.data.email });
//       } catch (error) {
//         console.error("Error fetching user data:", error.message);
//         toast.error("Failed to load user data");
//       }
//     };
//     fetchUser();
//   }, []);


//   useEffect(() => {
//     const fetchProgress = async () => {
//       try {
//         const res = await axios.get("/api/v1/user/progress", {
//           headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//         });
//         setProgress(res.data.data || {});
//       } catch (error) {
//         console.error("Error fetching progress:", error.message);
//         toast.error("Failed to load progress");
//       }
//     };
//     fetchProgress();
//   }, []);

//   useEffect(() => {
//     const fetchMockList = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const res = await axios.get("/api/v1/user/get-mock-cards", {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         const mocks = res.data.data.map((m) => {
//           const completedMock = user?.completedMocks?.find(
//             (cm) => cm.language === m.language
//           );
//           return {
//             language: m.language,
//             completed: completedMock ? true : false,
//             date: completedMock?.date || "",
//           };
//         });
//         setMockList(mocks);
//       } catch (error) {
//         console.error("Error fetching mock tests:", error.message);
//         toast.error("Failed to load mock tests");
//         setMockList([]);
//       }
//     };
//     if (user) fetchMockList();
//   }, [user]);

 
//   const handleUpdate = async () => {
//     try {
//       const res = await axios.put("/api/v1/user/update_profile", formData, {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       setUser(res.data.data);
//       setEditMode(false);
//       toast.success("Profile updated successfully!");
//     } catch (error) {
//       console.error("Update failed:", error.message);
//       toast.error("Failed to update profile");
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     setSelectedFile(file);
//     setPreviewImage(URL.createObjectURL(file));
//   };


//   const handleImageUpload = async () => {
//     if (!selectedFile) {
//       toast.error("Please select an image first");
//       return;
//     }
//     const formData = new FormData();
//     formData.append("image", selectedFile);
//     try {
//       const res = await axios.put("/api/v1/user/upload_profile_image", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       setUser(res.data.data);
//       setPreviewImage(null);
//       setSelectedFile(null);
//       toast.success("Profile photo updated!");
//     } catch (err) {
//       console.error("Upload failed:", err);
//       toast.error("Failed to upload image");
//     }
//   };

//   const handleDeleteImage = async () => {
//     const result = await MySwal.fire({
//       title: "Are you sure?",
//       text: "Do you really want to delete your profile image?",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Yes, delete it!",
//     });

//     if (!result.isConfirmed) return;

//     try {
//       const res = await axios.delete("/api/v1/user/delete_profile_image", {
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });
//       setUser(res.data.data);
//       toast.success("Profile image deleted!");
//       MySwal.fire("Cleared!", "Your Profile Image is Removed", "success");
//     } catch (err) {
//       console.error("Delete failed:", err);
//       toast.error("Failed to delete image");
//     }
//   };

//   const chartData = {
//     labels: Object.keys(progress),
//     datasets: [
//       {
//         label: "Correct Answers",
//         data: Object.values(progress).map((p) => p.correct),
//         backgroundColor: "rgba(75, 192, 192, 0.6)",
//       },
//       {
//         label: "Total Questions",
//         data: Object.values(progress).map((p) => p.total),
//         backgroundColor: "rgba(255, 99, 132, 0.6)",
//       },
//     ],
//   };

//   const mockColumns = [
//     { title: "Language", dataIndex: "language", key: "language" },
//     {
//       title: "Completed",
//       dataIndex: "completed",
//       key: "completed",
//       render: (completed) =>
//         completed ? (
//           <Tag color="green" style={{ border: "1px solid green" }}>Yes</Tag>
//         ) : (
//           <Tag color="red" style={{ border: "1px solid red" }}>No</Tag>
//         ),
//     },
//     {
//       title: "Date",
//       dataIndex: "date",
//       key: "date",
//       render: (date) =>
//         date ? new Date(date).toLocaleDateString("en-GB") : "No Completed Date Found",
//     },
//   ];

//   return (
//     <div className="profile-page">
//       <div className="profile-wrapper">
//         <div className="profile-container">
//           <h2 className="profile-title">{formData.name} Profile</h2>

//           {user ? (
//             <div className="profile-card">
//               <div className="avatar">
//                 {user.profileImage ? (
//                   <img src={user.profileImage } alt="Profile" className="profile-img" />
//                 ) : (
//                     <img src={defaultAvatar} alt="Profile" className="profile-img" />
//                 )}
//                 <label htmlFor="file-upload" className="camera-icon">
//                   <FaCamera />
//                 </label>
//                 <input
//                   id="file-upload"
//                   type="file"
//                   accept="image/*"
//                   onChange={handleFileChange}
//                   style={{ display: "none" }}
//                 />
//               </div>

//               {previewImage && (
//                 <div className="image-preview">
//                   <img src={previewImage} alt="Preview" />
//                   <button onClick={handleImageUpload} className="save-btn">
//                     Upload
//                   </button>
//                 </div>
//               )}


//               {!editMode && (
//                 <FaPen className="edit-icon" onClick={() => setEditMode(true)} />
//               )}

//               {editMode ? (
//                 <>
//                   <div className="input-group">
//                     <label>Name:</label>
//                     <input
//                       type="text"
//                       value={formData.name}
//                       onChange={(e) =>
//                         setFormData({ ...formData, name: e.target.value })
//                       }
//                       className="profile-input"
//                     />
//                   </div>
//                   <div className="input-group">
//                     <label>Email:</label>
//                     <input
//                       type="email"
//                       value={formData.email}
//                       onChange={(e) =>
//                         setFormData({ ...formData, email: e.target.value })
//                       }
//                       className="profile-input"
//                     />
//                   </div>
//                   {user?.profileImage && (
//                     <button className="delete-btn" onClick={handleDeleteImage}>
//                       Delete Profile Image
//                     </button>
//                   )}
//                   <div className="edit-buttons">
//                     <button className="save-btn" onClick={handleUpdate}>
//                       Save
//                     </button>
//                     <button
//                       className="cancel-btn"
//                       onClick={() => setEditMode(false)}
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <p><strong>Profile ID:</strong> {user._id}</p>
//                   <p><strong>Name:</strong> {user.name}</p>
//                   <p><strong>Email:</strong> {user.email}</p>
//                   <p>
//                     <strong>Created At:</strong>{" "}
//                     {new Date(user.createdAt).toLocaleDateString()}{" "}
//                     {new Date(user.createdAt).toLocaleTimeString()}
//                   </p>
//                   <p>
//                     <strong>Last Updated:</strong>{" "}
//                     {new Date(user.updatedAt).toLocaleDateString()}{" "}
//                     {new Date(user.updatedAt).toLocaleTimeString()}
//                   </p>
//                   {user.isAdmin && <p><strong>Role:</strong> Admin</p>}
//                 </>
//               )}
//             </div>
//           ) : (
//             <p className="loading">Loading user data...</p>
//           )}
//         </div>
//       </div>

//       <div className="big-stats-container">
//         <h3>Quiz Progress by Language</h3>
//         {Object.keys(progress).length > 0 ? (
//           <Bar data={chartData} />
//         ) : (
//           <p className="no-data">No quiz progress found yet.</p>
//         )}
//       </div>

//       <div className="big-stats-container">
//         <h3>Mock Tests</h3>
//         {mockList.length > 0 ? (
//           <Table
//             dataSource={mockList.map((m, index) => ({ key: index, ...m }))}
//             columns={mockColumns}
//             pagination={false}
//             bordered
//           />
//         ) : (
//           <p className="no-data">No mock tests available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Profile;




































import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/profile.css";
import { FaPen, FaCamera } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Bar } from "react-chartjs-2";
import defaultAvatar from "../assets/default-avatar.png";
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
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Profile = () => {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [mockList, setMockList] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
