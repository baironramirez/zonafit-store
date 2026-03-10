import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdlFQLoMBh7u2tnDPn2NNVfeUHRJCNgsM",
  authDomain: "zonafit-store.firebaseapp.com",
  projectId: "zonafit-store",
  storageBucket: "zonafit-store.firebasestorage.app",
  messagingSenderId: "152818121659",
  appId: "1:152818121659:web:fe4f65cdbe53c0ac24629e",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
