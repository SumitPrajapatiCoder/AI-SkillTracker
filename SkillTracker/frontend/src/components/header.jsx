import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/header.css";
import axios from "axios";
import { FaBars, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Header = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logout Successful!");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="left">
        <Link to="/home">
          {" "}
          {user && <span className="username">{user.name}</span>}
        </Link>
      </div>

      <div className="center">
        <Link to="/home" className="brand-link">
          <span className="brand-text">SkillTracker</span>
        </Link>
      </div>

      <div className="right">
        <div
          className="dropdown-icon"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {showDropdown ? <FaTimes /> : <FaBars />}
        </div>

        {showDropdown && (
          <div className="dropdown-menu">
            {user?.isAdmin && (
              <div className="admin-dropdown">
                <div
                  className="admin-toggle"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                >
                  <span>Admin Panel</span>
                  {showAdminMenu ? <FaChevronUp /> : <FaChevronDown />}
                </div>

                {showAdminMenu && (
                  <div className="admin-menu">
                    <Link to="/upload" onClick={() => setShowDropdown(false)}>
                      Upload Question
                    </Link>
                    <Link
                      to="/allQuestion"
                      onClick={() => setShowDropdown(false)}
                    >
                      All Questions
                    </Link>
                    <Link
                      to="/upload-card"
                      onClick={() => setShowDropdown(false)}
                    >
                      Upload Card Details
                    </Link>
                    <Link to="/get-card" onClick={() => setShowDropdown(false)}>
                      List Card Details
                    </Link>
                    <Link to="/userList" onClick={() => setShowDropdown(false)}>
                      User List
                    </Link>
                  </div>
                )}
              </div>
            )}

            <Link to="/home" onClick={() => setShowDropdown(false)}>
              Home
            </Link>
            <Link to="/profile" onClick={() => setShowDropdown(false)}>
              Profile
            </Link>
            <Link to="/quiz" onClick={() => setShowDropdown(false)}>
              Quiz
            </Link>
            <Link to="/mock_test" onClick={() => setShowDropdown(false)}>
              Mock Test
            </Link>
            <Link to="/roadmap" onClick={() => setShowDropdown(false)}>
              Roadmap
            </Link>
            <Link to="/study_plane" onClick={() => setShowDropdown(false)}>
              Study Plan
            </Link>
            <Link to="/chatbot_page" onClick={() => setShowDropdown(false)}>
              Chatbot
            </Link>
            {user && (
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

