// Import Firebase modules
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, onSnapshot, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Function to render a table row
function renderRow(doc) {
    const { emailAddress = 'N/A',representativeName = 'N/A', organizationName = 'N/A', typeOfAccreditation = 'N/A', dateFiling = 'N/A' } = doc.data().applicationDetails || {};
    
    // Check application status
    const applicationStatus = doc.data().applicationStatus || 'Pending'; // Default to 'Pending' if no status is found

    return `
        <tr data-id="${doc.id}">
            <td>${emailAddress}</td>
            <td>${representativeName}</td>
            <td>${organizationName}</td>
            <td>${typeOfAccreditation}</td>
            <td>${dateFiling}</td>
            <td>${applicationStatus}</td> <!-- Display application status -->
            <td><a href="../admin-dashboard/view-request.html?id=${doc.id}" class="view-link" data-id="${doc.id}">View</a></td>
            <td><button class="delete-btn" data-id="${doc.id}">Delete</button></td>
        </tr>
    `;
}

// Function to handle real-time data updates
function fetchApplications() {
    const tableBody = document.getElementById('pending-table-body');

    // Set up a real-time listener
    onSnapshot(collection(db, 'student-org-applications'), (snapshot) => {
        tableBody.innerHTML = ''; // Clear table body

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="7">No pending requests found.</td></tr>';
            return;
        }

        snapshot.forEach((doc) => {
            tableBody.innerHTML += renderRow(doc); // Add each row
        });

        attachDeleteHandlers(); // Attach delete handlers after rows are rendered
    }, (error) => {
        console.error("Error fetching real-time updates:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to fetch applications. Please try again later.'
        });
    });
}

// Function to handle document deletion
function attachDeleteHandlers() {
    const tableBody = document.getElementById('pending-table-body');

    tableBody.addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('.delete-btn');
        if (!deleteBtn) return;

        const requestId = deleteBtn.getAttribute('data-id');
        console.log("Deleting request ID:", requestId);

        if (!requestId) {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to retrieve request ID.'
            });
            return;
        }

        const { isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            customClass: 'swal-delete'
        });

        if (!isConfirmed) return;

        try {
            await deleteDoc(doc(db, 'student-org-applications', requestId));
            Swal.fire({
                title: 'Deleted!',
                text: 'The request has been deleted.',
                icon: 'success',
                customClass: 'swal-success'
            });
        } catch (error) {
            console.error("Error deleting request:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to delete the request. Please try again.',
                customClass: 'swal-delete'
            });
        }
    });
}

// Initialize when the DOM is loaded
window.addEventListener('DOMContentLoaded', fetchApplications);
