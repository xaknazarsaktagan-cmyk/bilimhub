// Единая точка подключения Firebase (Authentication + Cloud Firestore).
import {firebaseConfig} from './firebase-config.js';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
export {firebaseConfig};
export const configured=!Object.values(firebaseConfig).some(v=>String(v).includes('PASTE_'));
export const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);
// Второе приложение нужно администратору, чтобы создавать аккаунты, не выходя из своего.
export function secondaryAuth(){return getAuth(initializeApp(firebaseConfig,'secondary-'+Date.now()));}
