// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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
        getAllSubmissions(); // Fetch all submissions
        getUnreadSubmissions(); // Fetch unread submissions on login
    }
});

// Fetch all submissions for debugging and total count
async function getAllSubmissions() {
    try {
        console.log("Fetching all submissions..."); // Debugging line
        const q = query(collection(db, "student-org-applications"));
        const querySnapshot = await getDocs(q);

        const totalSubmissions = querySnapshot.size; // Count total submissions
        console.log("Total submissions fetched: ", totalSubmissions); // Debugging line

        // Update applicant count
        const applicantCountElement = document.querySelector('#applicant-count');
        applicantCountElement.textContent = totalSubmissions; // Update count here

        querySnapshot.forEach(doc => {
            console.log(doc.id, " => ", doc.data()); // Log each document's data
        });
    } catch (error) {
        console.error("Error fetching all submissions: ", error);
    }
}

// Fetch unread submissions
async function getUnreadSubmissions() {
    try {
        console.log("Fetching unread submissions..."); // Debugging line
        const q = query(collection(db, "student-org-applications"), where("isRead", "==", false));
        const querySnapshot = await getDocs(q);

        console.log("Number of unread submissions fetched: ", querySnapshot.size);

        const notifContainer = document.querySelector('#notifications-list');
        notifContainer.innerHTML = ''; // Clear existing notifications

        if (querySnapshot.empty) {
            console.log("No unread submissions found.");
            updateNotificationCount(0); // Update count to 0 if no unread submissions
            return; // Exit if there are no unread submissions
        }

        const uniqueOrganizations = new Set(); // To store unique organization names

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const appID = doc.id;

            // Add organization name to the Set
            uniqueOrganizations.add(data.organizationName);

            console.log(`Adding organization: ${data.organizationName}, ID: ${appID}`);

            // Create notification element
            const notifElement = createNotificationElement(data.organizationName, appID);
            notifContainer.appendChild(notifElement);
        });

        console.log("Unique organizations count: ", uniqueOrganizations.size);
        updateNotificationCount(uniqueOrganizations.size); // Update count here
    } catch (error) {
        console.error("Error fetching unread submissions: ", error);
    }
}

// Create a notification element
function createNotificationElement(orgName, appID) {
    const notifElement = document.createElement('div');
    notifElement.classList.add('notification-item');
    notifElement.innerHTML = `
        <p>New submission from <strong>${orgName}</strong></p>
        <button class="view-btn" data-id="${appID}">View</button>
    `;
    
    // Add click event to view button
    notifElement.querySelector('.view-btn').addEventListener('click', () => {
        viewSubmission(appID); // Call view function
    });

    return notifElement;
}

// View submission details
async function viewSubmission(appID) {
    const docRef = doc(db, "student-org-applications", appID);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            // Display the data in a modal or alert, for example
            alert(JSON.stringify(docSnap.data(), null, 2)); // For demonstration, show data in an alert
        } else {
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error getting document:", error);
    }
}

// Update notification count
function updateNotificationCount(count) {
    const notifCount = document.querySelector('#notification-count');
    notifCount.textContent = `${count}`; // Update count here
}
