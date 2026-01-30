const express = require("express");
const admin = require("../config/firebase-admin");
const { verifyFirebaseToken } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/user/stats
 *
 * Returns statistics about the authenticated user's notes
 * Demonstrates synchronous API call with Firebase Auth verification
 */
router.get("/stats", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    console.log(`📊 Fetching stats for user: ${userId}`);

    // Query Firestore for user's notes
    const notesSnapshot = await admin
      .firestore()
      .collection("notes")
      .where("userId", "==", userId)
      .get();

    // Calculate statistics
    const stats = {
      totalNotes: notesSnapshot.size,
      notesShared: 0,
      notesReceived: 0,
      totalCharacters: 0,
      recentNotes: [],
    };

    // Process each note
    notesSnapshot.forEach((doc) => {
      const note = doc.data();

      // Count shared notes
      if (note.sharedWith && note.sharedWith.length > 0) {
        stats.notesShared++;
      }

      // Count total characters
      stats.totalCharacters += (note.content || "").length;

      // Collect recent notes (last 5)
      if (stats.recentNotes.length < 5) {
        stats.recentNotes.push({
          id: doc.id,
          title: note.title,
          createdAt: note.createdAt?.toDate?.() || null,
          isShared: (note.sharedWith || []).length > 0,
        });
      }
    });

    // Query for notes shared WITH this user
    const sharedWithUserSnapshot = await admin
      .firestore()
      .collection("notes")
      .where("sharedWith", "array-contains", userId)
      .get();

    stats.notesReceived = sharedWithUserSnapshot.size;

    // Calculate average note length
    stats.averageNoteLength =
      stats.totalNotes > 0
        ? Math.round(stats.totalCharacters / stats.totalNotes)
        : 0;

    console.log(`✅ Stats calculated for user ${userId}:`, {
      totalNotes: stats.totalNotes,
      notesShared: stats.notesShared,
      notesReceived: stats.notesReceived,
    });

    res.json({
      success: true,
      user: {
        uid: userId,
        email: req.user.email,
      },
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);

    res.status(500).json({
      success: false,
      error: "InternalServerError",
      message: "Failed to fetch user statistics",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

/**
 * POST /api/user/export
 *
 * Exports all user's notes as JSON
 * Demonstrates bulk data operation requiring authentication
 */
router.post("/export", verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    console.log(`📦 Exporting notes for user: ${userId}`);

    // Query all user's notes
    const notesSnapshot = await admin
      .firestore()
      .collection("notes")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const notes = [];
    notesSnapshot.forEach((doc) => {
      const note = doc.data();
      notes.push({
        id: doc.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: note.updatedAt?.toDate?.()?.toISOString() || null,
        sharedWith: note.sharedWith || [],
      });
    });

    console.log(`✅ Exported ${notes.length} notes for user ${userId}`);

    res.json({
      success: true,
      user: {
        uid: userId,
        email: req.user.email,
      },
      notes,
      exportedAt: new Date().toISOString(),
      totalNotes: notes.length,
    });
  } catch (error) {
    console.error("❌ Error exporting notes:", error);

    res.status(500).json({
      success: false,
      error: "InternalServerError",
      message: "Failed to export notes",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
