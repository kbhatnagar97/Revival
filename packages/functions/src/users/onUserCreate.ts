import { logger } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';

/**
 * UserDocument interface matching DATABASE_SCHEMA.md
 */
interface UserDocument {
  email: string;
  name: string;
  picture?: string;
  provider: 'google.com' | 'password';
  createdAt: Timestamp;
  timezone: string;
  lastSeenAt: Timestamp;
}

/**
 * Callable function to create user document when user signs up
 * Note: Using callable function instead of auth trigger for better frontend integration
 * Follows DATABASE_SCHEMA.md specifications
 */
export const onUserCreate = onCall(callableFunctionOptions, async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = request.auth.uid;
  const { email, displayName, photoURL, provider } = request.data || {};

  try {
    logger.info(`Creating/updating user document for user: ${uid}`);

    // Check if user document already exists
    const existingDoc = await db.collection('users').doc(uid).get();
    
    if (existingDoc.exists) {
      // User already exists, just update lastSeenAt
      await db.collection('users').doc(uid).update({
        lastSeenAt: Timestamp.now(),
      });
      
      logger.info(`Updated existing user document for: ${uid}`);
      return { success: true, message: 'User document updated' };
    }

    // Create new user document matching DATABASE_SCHEMA.md
    const userDoc: UserDocument = {
      email: email || '',
      name: displayName || '',
      picture: photoURL || undefined,
      provider: provider || 'password',
      createdAt: Timestamp.now(),
      timezone: 'America/Los_Angeles', // Default timezone as per schema
      lastSeenAt: Timestamp.now(),
    };

    await db.collection('users').doc(uid).set(userDoc);

    logger.info(`Successfully created user document for: ${uid}`);
    return { success: true, message: 'User document created' };
  } catch (error) {
    logger.error('Error creating user document:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Failed to create user document');
  }
});
