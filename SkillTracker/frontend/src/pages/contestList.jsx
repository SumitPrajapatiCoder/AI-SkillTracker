import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaLock, FaPlayCircle, FaCalendarAlt } from "react-icons/fa";
import "../styles/contestList.css";

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("No token found");

                const [contestsRes, leaderboardRes, userRankRes] = await Promise.all([
                    axios.get("/api/v1/user/contestAll", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/v1/user/leaderboard/global", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/v1/user/user-rank", { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                setContests(contestsRes.data.contests || []);
                setLeaderboard(leaderboardRes.data.leaderboard || []);

                if (userRankRes.data.success && userRankRes.data.userRank) {
                    setUserRank(userRankRes.data.userRank);
                }

            } catch (err) {
                console.error(err);
                setError("Failed to load contests or leaderboard");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getStatus = (contest) => {
        const now = new Date();
        const publishTime = new Date(contest.publishDetails.date);
        return now < publishTime ? "comingSoon" : "liveOrPast";
    };

    const handleContestClick = (contest) => {
        if (getStatus(contest) === "comingSoon") return;
        navigate(`/contest/${contest._id}`);
    };

    if (loading) return <p className="contest-list-loading">Loading contests...</p>;
    if (error) return <p className="contest-list-error">{error}</p>;

    return (
        <section className="contest-list-wrapper">
            <h2><FaTrophy style={{ marginRight: "8px" }} /> Contests</h2>

            <div className="contest-list-grid">
                {contests.map((contest) => {
                    const status = getStatus(contest);
                    const isComingSoon = status === "comingSoon";
                    const publishDate = new Date(contest.publishDetails.date).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    });

                    return (
                        <article
                            key={contest._id}
                            className={`contest-list-card ${isComingSoon ? "coming-soon" : "active"}`}
                        >
                            <header className="contest-list-card-header">
                                <h3>Contest {contest._id.slice(-5).toUpperCase()}</h3>
                                <p>
                                    <strong>Questions:</strong> {contest.questionSize} |{" "}
                                    <strong>Duration:</strong> {contest.timeDuration} mins
                                </p>
                            </header>

                            <footer className="contest-list-card-footer">
                                <span className="contest-list-date">
                                    <FaCalendarAlt style={{ marginRight: "5px" }} /> {publishDate}
                                </span>

                                {isComingSoon ? (
                                    <span className="contest-list-status soon">
                                        <FaLock style={{ marginRight: "6px" }} /> Coming Soon
                                    </span>
                                ) : (
                                    <button
                                        className="contest-play-btn"
                                        onClick={() => handleContestClick(contest)}
                                    >
                                        <FaPlayCircle style={{ marginRight: "6px" }} /> Play Now
                                    </button>
                                )}
                            </footer>
                        </article>
                    );
                })}
            </div>

            {userRank && (
                <section className="user-rank">
                    <h3>Your Rank</h3>
                    <p>
                        <strong>Rank:</strong> {userRank.rank} | <strong>Name:</strong> {userRank.name} | <strong>Total Score:</strong> {userRank.totalScore}
                    </p>
                </section>
            )}

            <section className="global-leaderboard">
                <h2>Global Leaderboard</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Candidate Name</th>
                            <th>Total Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((user, index) => (
                            <tr key={user.userId} style={userRank?.name === user.name ? { backgroundColor: "#a7a79bff" } : {}}>
                                <td>{index + 1}</td>
                                <td>{user.name}</td>
                                <td>{user.totalScore}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </section>
    );
};

export default ContestList;
