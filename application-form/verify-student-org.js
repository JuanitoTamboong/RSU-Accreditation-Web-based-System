// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase Configuration
const firebaseConfigVerification = {
    apiKey: "AIzaSyCZbPRkZ7acdO0mx9_sfotDjueh4YioYwM",
    authDomain: "admin-9ee84.firebaseapp.com",
    projectId: "admin-9ee84",
    storageBucket: "admin-9ee84.firebasestorage.app",
    messagingSenderId: "65720582473",
    appId: "1:65720582473:web:48f63f7d4d100d65039a98"
};

/// Initialize Firebase for Student Verification
const appVerification = initializeApp(firebaseConfigVerification, "verification");
const dbVerification = getFirestore(appVerification);

// Function to verify if the student ID exists in the "verified-students" collection
async function verifyStudentId(studentID) {
    const studentRef = collection(dbVerification, 'verified-students');
    const q = query(studentRef, where("studentID", "==", studentID));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty; // Returns true if ID exists, false otherwise
}

// Function to validate the student ID format
function isValidStudentIdFormat(studentID) {
    const idPattern = /^\d{3}-\d{4}-\d{6}$/;
    return idPattern.test(studentID);
}

// Format Student ID function (xxx-xxxx-xxxxxx)
window.formatStudentId = function(event) {  
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 3) input = input.substring(0, 3) + '-' + input.substring(3);
    if (input.length > 8) input = input.substring(0, 8) + '-' + input.substring(8);
    event.target.value = input;
}

// Export functions for access in main app script
export { verifyStudentId, isValidStudentIdFormat };
