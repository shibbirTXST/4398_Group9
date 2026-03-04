import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB83b13IpRm_Plzr5e-yOotBmhYS5j5-6E",
  authDomain: "habittrack-2c615.firebaseapp.com",
  projectId: "habittrack-2c615",
  storageBucket: "habittrack-2c615.firebasestorage.app",
  messagingSenderId: "542895330928",
  appId: "1:542895330928:web:99f29bbb8071cc118686b5",
  // measurementId: "G-FKKED0NBHV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
