import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const provider = new GoogleAuthProvider();
const auth = getAuth();

export function signInWithGoogle() {
  signInWithRedirect(auth, provider);
}

export async function handleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      // Store user data in Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          firebaseUid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          createdAt: new Date(),
        });
      }
      
      return result.user;
    }
  } catch (error) {
    console.error("Error handling redirect:", error);
    throw error;
  }
}

export async function signOutUser() {
  await signOut(auth);
}
