import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBXJ2y4M8rgtrFNwa6wSytQ-z96Wkv3PZk",
  authDomain: "gen-lang-client-0153489972.firebaseapp.com",
  projectId: "gen-lang-client-0153489972",
  storageBucket: "gen-lang-client-0153489972.firebasestorage.app",
  messagingSenderId: "868766269071",
  appId: "1:868766269071:web:81775775f3174ebef83afa"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-widyapustakalibr-dfe478aa-d81b-4f7a-8c08-4c2678475c91");
export const auth = getAuth(app);

export { collection, onSnapshot, query, where };
