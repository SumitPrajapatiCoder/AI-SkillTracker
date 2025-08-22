import React from "react";
import "../styles/roadText.css";

function RoadMapText({ raodMap }) {
  const lines = raodMap.split("\n").filter(Boolean);

  return (
    <div className="road-map-content">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <h3
              className="fade-item"
              style={{ animationDelay: `${i * 0.05}s` }}
              key={i}
            >
              {line.replace(/\*\*/g, "")}
            </h3>
          );
        }

        else if (line.startsWith("* ")) {
          return (
            <div
              className="fade-item bullet"
              style={{ animationDelay: `${i * 0.05}s` }}
              key={i}
            >
              <span className="bullet-icon">📌</span>
              <span>{line.substring(2)}</span>
            </div>
          );
        }

        else if (line.match(/^\d+\./)) {
          return (
            <div
              className="fade-item numbered"
              style={{ animationDelay: `${i * 0.05}s` }}
              key={i}
            >
              <span className="number-icon">{line.split(".")[0]}.</span>
              <span>{line.substring(line.indexOf(".") + 1).trim()}</span>
            </div>
          );
        }
        
        else {
          return (
            <p
              className="fade-item"
              style={{ animationDelay: `${i * 0.05}s` }}
              key={i}
            >
              {line}
            </p>
          );
        }
      })}
    </div>
  );
}

export default RoadMapText;
