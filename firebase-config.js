// ==========================================
// CITY INTERNATIONAL ONLINE SCHOOL
// FIREBASE CONFIGURATION
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCo7RIDgBC9ij3RHhl-H4EJ4Eas60OiR9c",
    authDomain: "cityinternationalonlineschool.firebaseapp.com",
    databaseURL: "https://cityinternationalonlineschool-default-rtdb.firebaseio.com",
    projectId: "cityinternationalonlineschool",
    storageBucket: "cityinternationalonlineschool.firebasestorage.app",
    messagingSenderId: "184836758163",
    appId: "1:184836758163:web:33a840759afb02344b0b66",
    measurementId: "G-D90M4V06R0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const database = getDatabase(app);

export { app, database };