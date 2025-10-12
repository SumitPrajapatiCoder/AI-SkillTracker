import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaLock, FaPlayCircle, FaCalendarAlt } from "react-icons/fa";
import "../styles/contestList.css";

const ContestList = () => {
    const [contests, setContests] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContests = async () => {
            try {
                const token = localStorage.getItem("token");

                const [contestsRes, leaderboardRes] = await Promise.all([
                    axios.get("/api/v1/user/contestAll", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("/api/v1/user/leaderboard/global", { headers: { Authorization: `Bearer ${token}` } }),
                ]);

                setContests(contestsRes.data.contests || []);
                setLeaderboard(leaderboardRes.data.leaderboard || []);
            } catch (err) {
                console.error(err);
                setError("Failed to load contests or leaderboard");
            } finally {
                setLoading(false);
            }
        };

        fetchContests();
    }, []);

    const getStatus = (contest) => {
        const now = new Date();
        const publishTime = new Date(contest.publishDetails.date);
        if (now < publishTime) return "comingSoon";
        return "liveOrPast";
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
                    const publishDate = new Date(contest.publishDetails.date).toLocaleString();

                    return (
                        <article
                            key={contest._id}
                            className={`contest-list-card ${isComingSoon ? "coming-soon" : "active"}`}
                            onClick={() => handleContestClick(contest)}
                        >
                            <header className="contest-list-card-header">
                                <h3>Contest {contest._id.slice(-5)}</h3>
                                <p>
                                    <strong>Questions:</strong> {contest.questionSize} |{" "}
                                    <strong>Duration:</strong> {contest.timeDuration} mins
                                </p>
                            </header>

                            <footer className="contest-list-card-footer">
                                {isComingSoon ? (
                                    <span className="contest-list-status soon">
                                        <FaLock style={{ marginRight: "5px" }} /> Coming Soon
                                    </span>
                                ) : (
                                    <span className="contest-list-status live">
                                        <FaPlayCircle style={{ marginRight: "5px" }} /> Play Now
                                    </span>
                                )}
                                <span className="contest-list-date">
                                    <FaCalendarAlt style={{ marginRight: "4px" }} /> {publishDate}
                                </span>
                            </footer>
                        </article>
                    );
                })}
            </div>

            {/* Global Leaderboard */}
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
                            <tr key={user.userId}>
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
