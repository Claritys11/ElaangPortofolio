import { getStorageType } from '@/lib/storage-type';

const storageType = getStorageType();
const isFirebaseStorage = storageType === 'firebase';

export const firebaseConfig = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};

export const activeStorageType = storageType;

if (isFirebaseStorage && (!firebaseConfig.projectId || !firebaseConfig.appId || !firebaseConfig.apiKey || !firebaseConfig.authDomain)) {
    throw new Error("Missing Firebase configuration while NEXT_PUBLIC_STORAGE_TYPE is set to firebase. Please check your .env.local file");
}
