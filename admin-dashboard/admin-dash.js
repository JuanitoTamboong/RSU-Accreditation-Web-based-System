// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
    authDomain: "student-org-5d42a.firebaseapp.com",
    projectId: "student-org-5d42a",
    storageBucket: "student-org-5d42a.appspot.com",
    messagingSenderId: "1073695504078",
    appId: "1:1073695504078:web:eca07da6a1563c46e0829f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const sidebar = document.querySelector('.sidebar');
const closeButton = document.querySelector('.close-btn');
const menuButton = document.querySelector('.menu-btn');

function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    updateButtonVisibility();
}

function updateButtonVisibility() {
    if (sidebar.classList.contains('collapsed')) {
        closeButton.style.display = 'none'; // Hide close button
        menuButton.style.display = 'block'; // Show menu button
    } else {
        closeButton.style.display = 'block'; // Show close button
        menuButton.style.display = 'none'; // Hide menu button
    }
}

// Initialize button visibility
updateButtonVisibility();

closeButton.addEventListener('click', toggleSidebar);
menuButton.addEventListener('click', toggleSidebar);