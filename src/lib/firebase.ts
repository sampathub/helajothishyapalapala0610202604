import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogleFirebase() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      success: true as const,
      email: user.email,
      displayName: user.displayName,
      uid: user.uid,
      idToken: await user.getIdToken()
    };
  } catch (err: any) {
    console.warn("Firebase Auth signInWithPopup error:", err);
    return {
      success: false as const,
      error: err.message || String(err)
    };
  }
}
