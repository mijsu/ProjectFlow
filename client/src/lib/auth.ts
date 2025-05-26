import { 
  getAuth, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const provider = new GoogleAuthProvider();
const auth = getAuth();

export function signInWithGoogle() {
  return signInWithRedirect(auth, provider);
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

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(result.user, { displayName });
    
    // Store user data in Firestore
    const userRef = doc(db, "users", result.user.uid);
    await setDoc(userRef, {
      firebaseUid: result.user.uid,
      email: result.user.email,
      displayName: displayName,
      photoURL: null,
      createdAt: new Date(),
    });
    
    return result.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
