import { Timestamp } from 'firebase-admin/firestore';

export interface UserDocument {
  id: string;
  email: string;
  displayName?: string;
  timezone: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeenAt: Timestamp;
}
