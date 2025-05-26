
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDHXa0fRVou1lQdnEdoBmPvnXSJePCvWzY",
  authDomain: "software-engineering-a7470.firebaseapp.com",
  projectId: "software-engineering-a7470",
  storageBucket: "software-engineering-a7470.appspot.com",
  messagingSenderId: "421967741552",
  appId: "1:421967741552:web:24688a6db985ce0b22eab5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
