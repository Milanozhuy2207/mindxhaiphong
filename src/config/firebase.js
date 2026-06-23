import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDw1-XBuJ8AePwTgeoMMCjkKXp_xw36HVM",
  authDomain: "mindxproject-f76ff.firebaseapp.com",
  projectId: "mindxproject-f76ff",
  storageBucket: "mindxproject-f76ff.firebasestorage.app",
  messagingSenderId: "578958654043",
  appId: "1:578958654043:web:938e3cdf1c599046081d7e",
  measurementId: "G-SP4BHC1R0N"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);


export default app;
