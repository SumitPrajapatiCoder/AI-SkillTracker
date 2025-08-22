import React from "react";
import "../styles/home.css";

const Home = () => {
  return (
    <div className="home-container">
      <div className="page-content">
        <h1 className="home-title">Welcome to SkillTracker</h1>
        <p className="home-description">
          Your personal platform to{" "}
          <strong>learn, test, and grow your skills</strong> in a structured and
          rewarding way. Whether you're preparing for interviews, improving
          programming knowledge, or tracking your learning journey —
          SkillTracker has you covered.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Profile & Progress</h3>
            <p>
              View your learning journey in one place. Track quizzes, mock
              tests, certificates, and AI-generated study plans.
            </p>
          </div>
          <div className="feature-card">
            <h3>Quizzes</h3>
            <p>
              Take language-based quizzes to test your knowledge. After each
              quiz, get a personalized AI-generated <strong>Study Plan</strong>{" "}
              and <strong>Roadmap</strong>.
            </p>
          </div>
          <div className="feature-card">
            <h3>Mock Tests</h3>
            <p>
              Challenge yourself with real exam-style mock tests. Score full
              marks to earn an exclusive <strong>Certificate</strong> for your
              profile.
            </p>
          </div>
          <div className="feature-card">
            <h3>AI-Generated Study Plan</h3>
            <p>
              Every time you finish a quiz, our AI creates a tailored
              step-by-step study plan to help you improve on weak areas.
            </p>
          </div>
          <div className="feature-card">
            <h3>AI-Generated Roadmap</h3>
            <p>
              Get a clear, topic-wise roadmap for mastering the language you are
              learning — generated instantly after each quiz.
            </p>
          </div>
          <div className="feature-card">
            <h3>Skill Growth</h3>
            <p>
              All your activity — quizzes, study plans, mock tests, and
              certificates — helps you <strong>consistently grow</strong> your
              skills.
            </p>
          </div>
        </div>

        <p className="cta-text">
          Start your journey today. Take your first quiz, get your AI-powered
          study plan, and track your progress like never before!
        </p>
      </div>
    </div>
  );
};

export default Home;
