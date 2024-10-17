// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, query, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

// Retrieve viewed notifications from local storage
let viewedNotifications = JSON.parse(localStorage.getItem('viewedNotifications')) || [];

// Fetch applicants and notifications immediately
fetchApplicants();

// Function to fetch and display applicants and notifications
function fetchApplicants() {
    try {
        const q = query(collection(db, 'student-org-applications'));
        onSnapshot(q, (querySnapshot) => {
            const applicantCount = querySnapshot.size;
            updateApplicantCount(applicantCount); // Update count

            displayNotifications(querySnapshot); // Display notifications
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
    }
}

// Update applicant count displayed on the dashboard
function updateApplicantCount(count) {
    const applicantCountElement = document.querySelector('#applicant-count');
    if (applicantCountElement) {
        applicantCountElement.textContent = count;
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

    notificationsList.innerHTML = ''; // Clear previous notifications

    if (querySnapshot.empty) {
        notificationsList.innerHTML = '<li>No new notifications</li>';
        return;
    }

    let newNotificationsCount = 0;
    const notificationsArray = [];

    // Gather notification data
    querySnapshot.forEach((doc) => {
        const appData = doc.data();
        const docId = doc.id;
        const isViewed = viewedNotifications.includes(docId);

        const { 
            organizationName = "Unknown Organization", 
            representativeName = "Unknown Representative", 
            emailAddress = "Unknown Email", 
            dateFiling = new Date().toISOString() 
        } = appData.applicationDetails || {};

        const submissionTime = appData.submissionTime || '';
        const filingDate = new Date(dateFiling);
        const formattedDate = filingDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = submissionTime || filingDate.toLocaleTimeString();

        notificationsArray.push({
            orgName: organizationName,
            repName: representativeName,
            email: emailAddress,
            formattedDate,
            formattedTime,
            docId,
            isViewed,
            filingDate
        });
    });

    // Sort notifications by filing date (newest first)
    notificationsArray.sort((a, b) => b.filingDate - a.filingDate);

    // Render notifications
    notificationsArray.forEach(({ orgName, repName, email, formattedDate, formattedTime, docId, isViewed }) => {
        const notificationItem = document.createElement('li');
        notificationItem.innerHTML = `
            <span>${orgName} submitted by ${repName} (Email: ${email})</span>
            <br><small>Filed on: ${formattedDate} at ${formattedTime}</small>
        `;
        notificationItem.dataset.docId = docId; // Store doc ID

        if (!isViewed) {
            notificationItem.style.fontWeight = 'bold'; // Highlight new notifications
            newNotificationsCount++;
        }

        notificationsList.prepend(notificationItem); // Add the newest notification on top
    });

    // Update the notification count
    updateNotificationCount(newNotificationsCount);
}

// Update notification count (new/unread notifications)
function updateNotificationCount(count) {
    const notificationCountElement = document.getElementById('notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = count;
    }
}

// Show/hide the notification modal when the icon is clicked
document.getElementById('notification-icon').addEventListener('click', () => {
    const modal = document.getElementById('notification-modal');
    modal.classList.toggle('active');

    if (modal.classList.contains('active')) {
        markNotificationsAsViewed(); // Mark notifications as viewed
    }
});

// Mark all notifications as viewed and update local storage
function markNotificationsAsViewed() {
    const notificationItems = document.querySelectorAll('#notification-list li');

    notificationItems.forEach((item) => {
        const docId = item.dataset.docId;
        if (!viewedNotifications.includes(docId)) {
            viewedNotifications.push(docId);
        }
    });

    localStorage.setItem('viewedNotifications', JSON.stringify(viewedNotifications));
    updateNotificationCount(0); // Reset notification count
}

// Close the modal when the close button is clicked
document.getElementById('close-notification-modal').addEventListener('click', () => {
    document.getElementById('notification-modal').classList.remove('active');
});
