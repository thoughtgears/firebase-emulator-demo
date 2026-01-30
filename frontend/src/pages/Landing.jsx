import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Landing({ user }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div>
      <nav>
        <h1>📝 TeamNotes</h1>
        <button onClick={() => navigate("/login")}>
          Sign In
        </button>
      </nav>

      <div className="container">
        <div className="hero">
          <h1>Welcome to TeamNotes</h1>
          <p>A simple collaborative note-taking app</p>
          <p style={{ fontSize: "1rem", opacity: 0.9 }}>
            Demonstrating Firebase Emulator + Docker + Cloud Run Architecture
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              fontSize: "1.25rem",
              padding: "1rem 2rem",
              marginTop: "1rem"
            }}
          >
            Get Started
          </button>
        </div>

        <div className="features">
          <div className="feature">
            <h3>🔒 Secure Authentication</h3>
            <p>Firebase Auth with email/password authentication</p>
          </div>

          <div className="feature">
            <h3>💾 Real-time Database</h3>
            <p>Store and sync notes with Firestore</p>
          </div>

          <div className="feature">
            <h3>🤝 Share Notes</h3>
            <p>Collaborate by sharing notes with other users</p>
          </div>

          <div className="feature">
            <h3>⚡ Event-Driven</h3>
            <p>Cloud Functions trigger on note sharing events</p>
          </div>

          <div className="feature">
            <h3>🚀 Cloud Run API</h3>
            <p>Node.js API for synchronous operations</p>
          </div>

          <div className="feature">
            <h3>🐳 Docker Setup</h3>
            <p>Complete local development environment</p>
          </div>
        </div>

        <div style={{
          textAlign: "center",
          marginTop: "3rem",
          padding: "2rem",
          background: "white",
          borderRadius: "8px"
        }}>
          <h2 style={{ marginBottom: "1rem" }}>Architecture Demo</h2>
          <p style={{ color: "#666", maxWidth: "800px", margin: "0 auto" }}>
            This project demonstrates a modern monorepo structure with Firebase
            Emulator, Cloud Functions, a Node.js API, and a React frontend—all
            running in Docker for easy local development and testing.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
