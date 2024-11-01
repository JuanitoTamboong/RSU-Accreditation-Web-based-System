import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyCZbPRkZ7acdO0mx9_sfotDjueh4YioYwM",
    authDomain: "admin-9ee84.firebaseapp.com",
    projectId: "admin-9ee84",
    storageBucket: "admin-9ee84.firebasestorage.app",
    messagingSenderId: "65720582473",
    appId: "1:65720582473:web:48f63f7d4d100d65039a98"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// List of known admin UIDs
const adminUIDs = [
    "7ks2azmorlZgAWVaur92njtp9p62", // animeforeverrr04@gmail.com
    "disOzy7FfhWrXK6yepTxu8APSpq1"  // testadmin@gmail.com
];

// Track authenticated admin count
let adminCount = 0;

function fetchAdminCount() {
    // Check if the authenticated user's UID is in the list of admin UIDs
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Check if the user is an admin
            if (adminUIDs.includes(user.uid)) {
                adminCount++;
                document.getElementById("admin-count").innerText = adminCount;
                
                // Update the admin user details in the sidebar
                document.getElementById("user-name").innerText = user.displayName || "Admin"; // Fallback if display name is not set
                document.getElementById("user-avatar").src = user.photoURL || "../assets/default-avatar.png"; // Fallback avatar
            }
        }
    });
}

// Call the function to fetch admin count
fetchAdminCount();
