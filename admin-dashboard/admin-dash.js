// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, query, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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
const auth = getAuth(app);  // Initialize authentication

// Redirect unauthenticated users
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.error("User is not logged in");
        window.location.href = "../admin-login/admin-login.html"; // Redirect to login page
    } else {
        console.log("User is logged in: ", user);
        fetchApplicants();  // Fetch applicants and notifications when admin is authenticated
    }
});

// Function to fetch and display applicants and notifications
async function fetchApplicants() {
    try {
        // Fetch all student organization applications from Firestore
        const q = query(collection(db, 'student-org-applications'));
        const querySnapshot = await getDocs(q);

        // Update the applicant count
        const applicantCount = querySnapshot.size; // Get number of applications
        updateApplicantCount(applicantCount);

        // Display notifications for submitted applications
        displayNotifications(querySnapshot);
    } catch (error) {
        console.error("Error fetching applications: ", error);
    }
}

// Update applicant count displayed on the dashboard
function updateApplicantCount(count) {
    const applicantCountElement = document.querySelector('#applicant-count');
    if (applicantCountElement) {
        applicantCountElement.textContent = count; // Update count here
    } else {
        console.error("Applicant count element not found");
    }
}
// Display notifications for each organization submitted
function displayNotifications(querySnapshot) {
    const notificationsList = document.getElementById('notification-list');

    if (!notificationsList) {
        console.error("Notifications list element not found");
        return;
    }

    // Clear the notifications list before appending new items
    notificationsList.innerHTML = '';

    // Check if there are any applications
    if (querySnapshot.empty) {
        notificationsList.innerHTML = '<li>No new notifications</li>'; // Use <li> for empty state
        return;
    }

    // Populate notifications list with organization submissions
    querySnapshot.forEach((doc) => {
        const appData = doc.data();
        console.log("Document ID:", doc.id); // Log the document ID
        console.log("Document Data:", appData); // Log the entire document data

        // Accessing nested properties correctly
        const applicationDetails = appData.applicationDetails || {};
        const orgName = applicationDetails.organizationName || "Unknown Organization";
        const repName = applicationDetails.representativeName || "Unknown Representative";
        const email = applicationDetails.emailAddress || "Unknown Email";

        // Create notification message
        const notificationItem = document.createElement('li'); // Use <li> for each notification
        notificationItem.textContent = `${orgName} submitted by ${repName} (Email: ${email})`;

        // Append the notification item to the list
        notificationsList.appendChild(notificationItem);
    });

    // Update notification count
    const notificationCountElement = document.getElementById('notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = querySnapshot.size; // Update notification count
    }
}

// Show/hide the notification modal when the icon is clicked
document.getElementById('notification-icon').addEventListener('click', () => {
    const modal = document.getElementById('notification-modal');
    modal.classList.toggle('active'); // Toggle visibility with 'active' class
});

// Close the modal when the close button is clicked
document.getElementById('close-notification-modal').addEventListener('click', () => {
    const modal = document.getElementById('notification-modal');
    modal.classList.remove('active'); // Hide modal
});
