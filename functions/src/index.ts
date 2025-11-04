import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Scheduled function to delete reservations marked as 'deleted' after 10 hours
export const cleanupDeletedReservations = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const tenHoursAgo = new admin.firestore.Timestamp(now.seconds - 10 * 60 * 60, now.nanoseconds);

    try {
      const snapshot = await db
        .collection('reservations')
        .where('status', '==', 'deleted')
        .where('createdAt', '<', tenHoursAgo)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Deleted ${snapshot.docs.length} expired deleted reservations`);
      return null;
    } catch (error) {
      console.error('Error cleaning up deleted reservations:', error);
      throw error;
    }
  });

// Scheduled function to delete reservations marked as 'done' after 24 hours
export const cleanupDoneReservations = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = new admin.firestore.Timestamp(now.seconds - 24 * 60 * 60, now.nanoseconds);

    try {
      const snapshot = await db
        .collection('reservations')
        .where('status', '==', 'done')
        .where('createdAt', '<', twentyFourHoursAgo)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`Deleted ${snapshot.docs.length} expired done reservations`);
      return null;
    } catch (error) {
      console.error('Error cleaning up done reservations:', error);
      throw error;
    }
  });
