import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../firebase";

function Login({ user }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }

      // Navigation handled by auth state change in App.jsx
    } catch (err) {
      console.error("Auth error:", err);

      // Handle specific error codes
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already in use. Try signing in instead.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password.");
          break;
        case "auth/invalid-credential":
          setError("Invalid credentials. Please check your email and password.");
          break;
        default:
          setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <nav>
        <h1>📝 TeamNotes</h1>
        <button onClick={() => navigate("/")}>
          Back to Home
        </button>
      </nav>

      <div className="container">
        <div className="form-container">
          <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", marginBottom: "1rem" }}
            >
              {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
            </button>

            <div style={{ textAlign: "center" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                style={{ width: "100%" }}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </button>
            </div>
          </form>

          <div style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "4px",
            fontSize: "0.875rem"
          }}>
            <strong>Demo Credentials:</strong>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>alice@example.com / password123</li>
              <li>bob@example.com / password123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
