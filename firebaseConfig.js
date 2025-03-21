import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHEtMEOro_i9z14PE02fpp5UuQYHeRBRE",
  authDomain: "cuttingoptimizer.firebaseapp.com",
  projectId: "cuttingoptimizer",
  storageBucket: "cuttingoptimizer.firebasestorage.app",
  messagingSenderId: "693032331230",
  appId: "1:693032331230:web:821cad7445dfc4dc775f4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Initialize Firebase Authentication
export default app;