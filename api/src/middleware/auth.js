const admin = require("../config/firebase-admin");

/**
 * Middleware to verify Firebase Auth token
 *
 * This demonstrates how to authenticate API requests using Firebase Auth tokens.
 * In a Cloud Run environment, this API would validate tokens from the frontend
 * without needing to manage user sessions or JWT secrets.
 *
 * Usage:
 *   app.get('/protected-route', verifyFirebaseToken, (req, res) => {
 *     // Access authenticated user via req.user
 *     const userId = req.user.uid;
 *   });
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid Authorization header. Expected format: 'Bearer <token>'",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    // Verify the token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user information to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      // Include any custom claims if needed
      customClaims: decodedToken,
    };

    console.log(`✅ Authenticated user: ${req.user.email} (${req.user.uid})`);

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    // Handle specific error cases
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        error: "TokenExpired",
        message: "Firebase ID token has expired. Please refresh your token.",
      });
    }

    if (error.code === "auth/argument-error") {
      return res.status(401).json({
        error: "InvalidToken",
        message: "Invalid token format",
      });
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Failed to verify authentication token",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = { verifyFirebaseToken };
