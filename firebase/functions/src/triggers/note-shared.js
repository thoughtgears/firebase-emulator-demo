const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
// FieldValue is imported from the modular "firebase-admin/firestore" entry
// point rather than read off the `admin.firestore` namespace, because
// `admin.firestore.FieldValue` is undefined inside the Functions emulator.
//
// The emulator's runtime (firebase-tools' functionsEmulatorRuntime) replaces
// the cached "firebase-admin" module with a Proxy and resolves each property
// through `Proxied.getOriginal`, which returns `value.bind(target)` for any
// function that is not a constructor. In firebase-admin v13 the `firestore`
// namespace is a function with no `.prototype`, so it takes exactly that
// branch -- and a bound function carries none of the original's own
// properties, so FieldValue, Timestamp, GeoPoint and FieldPath all vanish.
// The submodule below is a different module object, so the proxy never
// touches it. Outside the emulator both forms work.
const { FieldValue } = require("firebase-admin/firestore");
const { Logger } = require("../utils/logger");
const config = require("../config");

const logger = new Logger("onNoteShared");

/**
 * Triggered when a note document is created or updated
 * Detects when sharedWith array is modified and logs the sharing event
 *
 * In a real application, this could:
 * - Send email/push notifications to shared users
 * - Create activity log entries
 * - Update user notification counters
 * - Trigger webhooks
 */
exports.onNoteShared = onDocumentWritten(
    {
      document: "notes/{noteId}",
      ...config.functions.onNoteShared,
    },
    async (event) => {
      const { noteId } = event.params;
      const beforeData = event.data.before?.data();
      const afterData = event.data.after?.data();

      // Skip if document was deleted
      if (!afterData) {
        logger.debug("Note deleted, skipping", { noteId });
        return;
      }

      // Skip if this is a new note without shares
      if (!beforeData && (!afterData.sharedWith || afterData.sharedWith.length === 0)) {
        logger.debug("New note created without shares, skipping", { noteId });
        return;
      }

      const beforeShared = beforeData?.sharedWith || [];
      const afterShared = afterData?.sharedWith || [];

      // Detect newly shared users (users added to sharedWith array)
      const newlySharedUsers = afterShared.filter((userId) => !beforeShared.includes(userId));

      // Detect users who lost access (users removed from sharedWith array)
      const removedUsers = beforeShared.filter((userId) => !afterShared.includes(userId));

      // If no changes in sharing, skip
      if (newlySharedUsers.length === 0 && removedUsers.length === 0) {
        logger.debug("No sharing changes detected", { noteId });
        return;
      }

      logger.info("Note sharing changed", {
        noteId,
        noteTitle: afterData.title,
        ownerId: afterData.userId,
        newlySharedUsers,
        removedUsers,
      });

      try {
      // Create a shared activity log (demonstration of event-driven processing)
        const activityRef = admin.firestore().collection("activity").doc();

        await activityRef.set({
          type: "note_shared",
          noteId,
          noteTitle: afterData.title,
          ownerId: afterData.userId,
          newlySharedUsers,
          removedUsers,
          timestamp: FieldValue.serverTimestamp(),
        });

        logger.info("Activity log created", {
          noteId,
          activityId: activityRef.id,
        });

        // In a real app, you would:
        // 1. Send notifications to newlySharedUsers
        // 2. Update user notification counters
        // 3. Potentially trigger email/SMS/push notifications
        // 4. Log to external analytics services

        // For demo purposes, we'll just log the action
        if (newlySharedUsers.length > 0) {
          logger.info("Would send notifications to users", {
            noteId,
            users: newlySharedUsers,
          });
        }

        if (removedUsers.length > 0) {
          logger.info("Would notify users about access removal", {
            noteId,
            users: removedUsers,
          });
        }
      } catch (error) {
        logger.error("Failed to process note sharing event", {
          noteId,
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }
    },
);
