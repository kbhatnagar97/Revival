// Firebase Functions configuration
export const REGION = 'asia-south2';

// Function options for all callable functions
export const callableFunctionOptions = {
  region: REGION,
  memory: '256MiB' as const,
  timeoutSeconds: 60,
  cors: true,
};

// Function options for Firestore triggers
export const firestoreTriggerOptions = {
  region: REGION,
  memory: '256MiB' as const,
  timeoutSeconds: 60,
};
