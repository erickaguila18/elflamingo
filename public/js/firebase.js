import { firebaseConfig, SDK_VERSION } from "./config.js";
const base = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
const [appM, authM, fsM] = await Promise.all([
  import(`${base}/firebase-app.js`),
  import(`${base}/firebase-auth.js`),
  import(`${base}/firebase-firestore.js`),
]);
const app = appM.initializeApp(firebaseConfig);
export const auth = authM.getAuth(app);
export const db = fsM.getFirestore(app);
export { authM, fsM };
