import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function Dashboard({ user }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editingNote, setEditingNote] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharingNoteId, setSharingNoteId] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Subscribe to user's notes
    const notesQuery = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const notesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(notesData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching notes:", err);
        setError("Failed to load notes");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Failed to sign out");
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim()) return;

    try {
      await addDoc(collection(db, "notes"), {
        title: newNote.title,
        content: newNote.content,
        userId: user.uid,
        sharedWith: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNewNote({ title: "", content: "" });
      setError("");
    } catch (err) {
      console.error("Error creating note:", err);
      setError("Failed to create note");
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingNote.title.trim()) return;

    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        title: editingNote.title,
        content: editingNote.content,
        updatedAt: serverTimestamp(),
      });

      setEditingNote(null);
      setError("");
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));
      setError("");
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
    }
  };

  const handleShareNote = async (noteId) => {
    if (!shareEmail.trim()) return;

    try {
      const note = notes.find((n) => n.id === noteId);
      const currentSharedWith = note.sharedWith || [];

      // In a real app, you'd look up the user ID by email
      // For demo, we'll just use the email as the ID placeholder
      if (currentSharedWith.includes(shareEmail)) {
        setError("Note already shared with this user");
        return;
      }

      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, {
        sharedWith: [...currentSharedWith, shareEmail],
        updatedAt: serverTimestamp(),
      });

      setShareEmail("");
      setSharingNoteId(null);
      setError("");
    } catch (err) {
      console.error("Error sharing note:", err);
      setError("Failed to share note");
    }
  };

  const fetchStats = async () => {
    try {
      // Get ID token from Firebase Auth
      const idToken = await user.getIdToken();

      const response = await fetch(`${API_URL}/api/user/stats`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data.stats);
      setError("");
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError("Failed to fetch statistics from API");
    }
  };

  if (loading) {
    return <div className="loading">Loading your notes...</div>;
  }

  return (
    <div>
      <nav>
        <h1>📝 TeamNotes</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ color: "#666" }}>{user.email}</span>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      </nav>

      <div className="container">
        {error && <div className="message error">{error}</div>}

        <div className="user-info">
          <div>
            <h2>Welcome back!</h2>
            <p style={{ color: "#666", marginTop: "0.25rem" }}>
              You have {notes.length} {notes.length === 1 ? "note" : "notes"}
            </p>
          </div>
          <button onClick={fetchStats} className="btn-secondary">
            📊 Fetch Stats from API
          </button>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.totalNotes}</h3>
              <p>Total Notes</p>
            </div>
            <div className="stat-card">
              <h3>{stats.notesShared}</h3>
              <p>Notes Shared</p>
            </div>
            <div className="stat-card">
              <h3>{stats.notesReceived}</h3>
              <p>Notes Received</p>
            </div>
            <div className="stat-card">
              <h3>{stats.averageNoteLength}</h3>
              <p>Avg Characters</p>
            </div>
          </div>
        )}

        <div className="form-container" style={{ maxWidth: "800px" }}>
          <h3 style={{ marginBottom: "1rem" }}>Create New Note</h3>
          <form onSubmit={handleCreateNote}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote({ ...newNote, title: e.target.value })
                }
                placeholder="Note title..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content</label>
              <textarea
                id="content"
                value={newNote.content}
                onChange={(e) =>
                  setNewNote({ ...newNote, content: e.target.value })
                }
                placeholder="Write your note here..."
              />
            </div>

            <button type="submit">Create Note</button>
          </form>
        </div>

        <div className="notes-grid">
          {notes.map((note) => (
            <div key={note.id} className="note-card">
              {editingNote?.id === note.id ? (
                <>
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) =>
                      setEditingNote({ ...editingNote, title: e.target.value })
                    }
                    style={{ marginBottom: "0.5rem" }}
                  />
                  <textarea
                    value={editingNote.content}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        content: e.target.value,
                      })
                    }
                    style={{ marginBottom: "0.5rem" }}
                  />
                  <div className="note-actions">
                    <button onClick={() => handleUpdateNote(note.id)}>
                      Save
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditingNote(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>{note.title}</h3>
                  <p>{note.content || <em>No content</em>}</p>
                  <div className="note-meta">
                    {note.createdAt && (
                      <>
                        Created: {note.createdAt.toDate().toLocaleDateString()}
                      </>
                    )}
                    {note.sharedWith && note.sharedWith.length > 0 && (
                      <div style={{ marginTop: "0.25rem" }}>
                        Shared with: {note.sharedWith.join(", ")}
                      </div>
                    )}
                  </div>

                  {sharingNoteId === note.id ? (
                    <div style={{ marginBottom: "1rem" }}>
                      <input
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="Email to share with..."
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <div className="note-actions">
                        <button onClick={() => handleShareNote(note.id)}>
                          Share
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setSharingNoteId(null);
                            setShareEmail("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="note-actions">
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setEditingNote({
                            id: note.id,
                            title: note.title,
                            content: note.content,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setSharingNoteId(note.id)}
                      >
                        Share
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#666" }}>
            <p>No notes yet. Create your first note above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
