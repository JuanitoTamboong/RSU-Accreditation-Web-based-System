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
        getAllOrganizations(); // Fetch all organizations on login
    }
});

// Fetch all organizations that submitted applications and update applicant count
async function getAllOrganizations() {
    try {
        console.log("Fetching all submissions..."); // Debugging line
        const q = query(collection(db, "student-org-applications"));
        const querySnapshot = await getDocs(q);

        const organizations = []; // To store organization details
        let applicantCount = 0; // Initialize applicant count

        querySnapshot.forEach(doc => {
            const data = doc.data();
            organizations.push({
                name: data.organizationName,
                email: data.email // Assuming email is part of the submission data
            }); // Add organization name and email to the list
            applicantCount++; // Increment count for each application
        });

        console.log("Total Applicants: ", applicantCount); // Debugging line

        // Update the applicant count displayed on the dashboard
        updateApplicantCount(applicantCount);

        // If there are new submissions, display the organizations in the notifications list
        if (organizations.length > 0) {
            displayOrganizations(organizations);
        }
    } catch (error) {
        console.error("Error fetching organizations: ", error);
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

// Display organizations in the notification area
function displayOrganizations(organizations) {
    const notifContainer = document.querySelector('#notifications-list');
    if (notifContainer) {
        notifContainer.innerHTML = ''; // Clear existing notifications

        // Create a notification element for the new submissions
        const notifElement = document.createElement('div');
        notifElement.classList.add('notification-item');
        notifElement.innerHTML = `
            <p>New Notification: ${organizations.length} new submission(s)</p>
        `;
        notifElement.addEventListener('click', () => viewSubmissions(organizations)); // Add click event to view submissions
        notifContainer.appendChild(notifElement);
    } else {
        console.error("Notification container not found");
    }
}

// Function to view submissions (organization names and emails)
function viewSubmissions(organizations) {
    const notifContainer = document.querySelector('#notifications-list');
    notifContainer.innerHTML = ''; // Clear existing notifications

    organizations.forEach(org => {
        const orgElement = document.createElement('div');
        orgElement.classList.add('notification-item');
        orgElement.innerHTML = `
            <p>Organization: <strong>${org.name}</strong> | Email: <strong>${org.email}</strong></p>
        `;
        notifContainer.appendChild(orgElement);
    });
}

// Function to handle notification icon click
document.querySelector('#notification-icon').addEventListener('click', getAllOrganizations);

// Update notification count if needed
function updateNotificationCount(count) {
    const notifCount = document.querySelector('#notification-count');
    if (notifCount) {
        notifCount.textContent = `${count}`; // Update count here
    } else {
        console.error("Notification count element not found");
    }
}
