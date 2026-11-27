// La config web de Firebase NO es secreta: la seguridad la dan las reglas de Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyDeNGQFkTYaNz1Ho15sjPQF5o3nVTPkLr0",
  authDomain: "elflamingo-bd80c.firebaseapp.com",
  projectId: "elflamingo-bd80c",
  storageBucket: "elflamingo-bd80c.firebasestorage.app",
  messagingSenderId: "317543066765",
  appId: "1:317543066765:web:8a01ca2569b5baecff86c4",
};
export const SDK_VERSION = "13.4.0"; // versión única del SDK; cámbiala aquí si no carga
export const APP = {
  currency: "MXN",
  locale: "es-MX",
  whatsapp: "", // código de país + número, sin + ni espacios. Ej. 52XXXXXXXXXX
};
