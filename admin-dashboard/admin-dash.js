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
const auth = getAuth(app);

// Retrieve viewed notifications from local storage
let viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications')) || [];

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

    let newNotificationsCount = 0;

    // Populate notifications list with organization submissions
    querySnapshot.forEach((doc) => {
        const appData = doc.data();
        const docId = doc.id;

        // Check if this notification has been viewed before
        const isViewed = viewedNotifications.includes(docId);

        // Accessing nested properties correctly
        const applicationDetails = appData.applicationDetails || {};
        const orgName = applicationDetails.organizationName || "Unknown Organization";
        const repName = applicationDetails.representativeName || "Unknown Representative";
        const email = applicationDetails.emailAddress || "Unknown Email";

        // Create notification message
        const notificationItem = document.createElement('li');
        notificationItem.textContent = `${orgName} submitted by ${repName} (Email: ${email})`;
        notificationItem.setAttribute('data-doc-id', docId); // Store doc ID for future reference

        // Append the notification item to the list
        notificationsList.appendChild(notificationItem);

        // Increment the notification count only if it's not viewed yet
        if (!isViewed) {
            newNotificationsCount++;
        }
    });

    // Update notification count (show only new/unread notifications)
    const notificationCountElement = document.getElementById('notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = newNotificationsCount;
    }
}

// Show/hide the notification modal when the icon is clicked
document.getElementById('notification-icon').addEventListener('click', () => {
    const modal = document.getElementById('notification-modal');
    modal.classList.toggle('active'); // Toggle visibility with 'active' class

    // Mark notifications as viewed when modal is opened
    if (modal.classList.contains('active')) {
        markNotificationsAsViewed();
    }
});

// Mark all notifications as viewed and update local storage
function markNotificationsAsViewed() {
    const notificationItems = document.querySelectorAll('#notification-list li');
    notificationItems.forEach((item) => {
        const docId = item.getAttribute('data-doc-id');
        if (!viewedNotifications.includes(docId)) {
            viewedNotifications.push(docId); // Add this notification to viewed
        }
    });

    // Save the updated list of viewed notifications in local storage
    localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));

    // Reset the notification count to 0
    const notificationCountElement = document.getElementById('notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = '0';
    }
}

// Close the modal when the close button is clicked
document.getElementById('close-notification-modal').addEventListener('click', () => {
    const modal = document.getElementById('notification-modal');
    modal.classList.remove('active'); // Hide modal
});
