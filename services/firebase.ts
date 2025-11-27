import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCNknt-xIC9MavtULQ6GwZViDX6Go1Wc2Q",
  authDomain: "gensuit-ai.firebaseapp.com",
  projectId: "gensuit-ai",
  storageBucket: "gensuit-ai.firebasestorage.app",
  messagingSenderId: "474394702560",
  appId: "1:474394702560:web:44895afa888fd638465685"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Export auth functions for use in components
export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup,
  updateProfile 
};
export type { FirebaseUser };