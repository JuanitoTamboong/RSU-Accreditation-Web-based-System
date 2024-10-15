// Import Firebase modules
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
    authDomain: "student-org-5d42a.firebaseapp.com",
    databaseURL: "https://student-org-5d42a-default-rtdb.firebaseio.com",
    projectId: "student-org-5d42a",
    storageBucket: "student-org-5d42a.appspot.com",
    messagingSenderId: "1073695504078",
    appId: "1:1073695504078:web:eca07da6a1563c46e0829f"
};

// Initialize Firebase only if there are no initialized apps
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0]; // Use the existing app
}

const db = getFirestore(app);

// Function to fetch pending requests and populate the table
async function fetchApplications() {
    const tableBody = document.getElementById('pending-table-body');
    tableBody.innerHTML = '<tr><td colspan="6">Loading applications...</td></tr>'; // Loading state

    try {
        const querySnapshot = await getDocs(collection(db, 'student-org-applications'));
        console.log("Number of documents fetched:", querySnapshot.docs.length);
        
        tableBody.innerHTML = ''; // Clear previous content

        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6">No pending requests found.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id; // Get document ID here
            console.log("Document ID:", docId); // Log the document ID
            console.log("Fetched document data:", data); // Log document data to check structure

            const applicationDetails = data.applicationDetails || {};
            const row = `
                <tr data-id="${docId}">
                    <td>${applicationDetails.emailAddress || 'N/A'}</td>
                    <td>${applicationDetails.organizationName || 'N/A'}</td>
                    <td>${applicationDetails.typeOfAccreditation || 'N/A'}</td>
                    <td>${applicationDetails.dateFiling || 'N/A'}</td>
                    <td><a href="#" class="view-link" data-id="${docId}">View</a></td>
                    <td><button class="delete-btn" data-id="${docId}">Delete</button></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // Attach event listeners for delete buttons after rows are added
        attachDeleteHandlers();
    } catch (error) {
        console.error("Error fetching applications: ", error);
        alert('Failed to fetch applications. Please try again later.');
    }
}

// Function to handle deletion of documents from Firestore and table
function attachDeleteHandlers() {
    const tableBody = document.getElementById('pending-table-body');

    // Use event delegation to ensure that event listeners are attached even for dynamically added rows
    tableBody.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const requestId = event.target.getAttribute('data-id');
            console.log("Request ID to delete:", requestId); // Log the request ID to ensure it's correct

            if (!requestId) {
                console.error("Request ID is missing!");
                alert("Failed to retrieve request ID.");
                return;
            }

            const confirmation = confirm("Are you sure you want to delete this request?");
            if (!confirmation) return; // Exit if the user cancels

            try {
                // Delete the document from Firestore
                await deleteDoc(doc(db, "student-org-applications", requestId));

                // Remove the row from the table
                document.querySelector(`tr[data-id="${requestId}"]`).remove();
                alert('Request deleted successfully!');
            } catch (error) {
                console.error("Error deleting request: ", error);
                alert('Failed to delete the request. Please try again.');
            }
        }
    });
}

// Ensure the DOM is fully loaded before calling fetchApplications
window.addEventListener('DOMContentLoaded', () => {
    fetchApplications(); // Call the function to fetch applications when the page loads
});
