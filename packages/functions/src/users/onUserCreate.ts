import { logger } from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { callableFunctionOptions } from '../lib/config';
import { db, Timestamp } from '../lib/firebase';

/**
 * UserDocument interface matching DATABASE_SCHEMA.md
 */
interface UserDocument {
  email: string;
  displayName: string;
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
  try {
    // Check if user is authenticated
    if (!request.auth) {
      logger.error('Unauthenticated request to onUserCreate');
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const uid = request.auth.uid;
    const userData = request.data || {};
    const { email, displayName, photoURL, provider } = userData;

    logger.info(`Creating/updating user document for user: ${uid}`, {
      email: email || 'not provided',
      displayName: displayName || 'not provided',
      provider: provider || 'not provided'
    });

    // Get user email from auth token if not provided in data
    const userEmail = email || request.auth.token.email || '';
    const userName = displayName || request.auth.token.name || '';
    const userPhoto = photoURL || request.auth.token.picture;
    
    // Determine provider from auth token if not provided
    let userProvider: 'google.com' | 'password' = 'password';
    if (provider) {
      userProvider = provider;
    } else if (request.auth.token.firebase?.sign_in_provider) {
      userProvider = request.auth.token.firebase.sign_in_provider === 'google.com' ? 'google.com' : 'password';
    }

    // Check if user document already exists
    const existingDoc = await db.collection('users').doc(uid).get();
    
    if (existingDoc.exists) {
      // User already exists, just update lastSeenAt
      await db.collection('users').doc(uid).update({
        lastSeenAt: Timestamp.now(),
      });
      
      logger.info(`Updated existing user document for: ${uid}`);
      return { 
        success: true, 
        message: 'User document updated',
        user: existingDoc.data()
      };
    }

    // Create new user document matching DATABASE_SCHEMA.md
    const userDoc: UserDocument = {
      email: userEmail,
      displayName: userName,
      picture: userPhoto || undefined,
      provider: userProvider,
      createdAt: Timestamp.now(),
      timezone: 'Asia/Kolkata', // Default timezone (Delhi/India)
      lastSeenAt: Timestamp.now(),
    };

    await db.collection('users').doc(uid).set(userDoc);

    logger.info(`Successfully created user document for: ${uid}`);
    return { 
      success: true, 
      message: 'User document created',
      user: userDoc
    };
  } catch (error) {
    logger.error('Error in onUserCreate function:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      uid: request.auth?.uid,
      data: request.data
    });
    
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', `Failed to create user document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
