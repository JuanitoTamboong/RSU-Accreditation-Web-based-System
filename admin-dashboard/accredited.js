// Import Firebase modules
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Function to render a table row for accredited applicants
function renderRow(doc) {
    const data = doc.data();
    const applicantId = doc.id;

    // Destructure necessary fields with default values
    const {
        applicationStatus = 'N/A',
        statusUpdateTimestamp,
        applicationDetails = {}
    } = data; 

    const {
        organizationName = 'N/A',
        representativeName = 'N/A',
        emailAddress = 'N/A',
        typeOfAccreditation = 'N/A',
        dateFiling = 'N/A'
    } = applicationDetails;

    // Format the status update timestamp
    const dateApproved = statusUpdateTimestamp ? new Date(statusUpdateTimestamp).toLocaleString() : 'N/A';

    return `
        <tr data-id="${applicantId}">
            <td>${organizationName}</td>
            <td>${representativeName}</td>
            <td>${emailAddress}</td>
            <td>${typeOfAccreditation}</td>
            <td>${dateFiling}</td>
            <td>${dateApproved}</td>
            <td>${applicationStatus}</td>
            <td>
                <button class="delete-btn" data-id="${applicantId}">Delete</button>
            </td>
        </tr>
    `;
}

// Reference to the Firestore collection
const applicantsRef = collection(db, 'student-org-applications');

// Query for approved applications
const approvedQuery = query(applicantsRef, where("applicationStatus", "==", "Approved"));

// Fetch and display data in the table
onSnapshot(approvedQuery, (snapshot) => {
    const applicantsTableBody = document.getElementById('applicants-table-body');
    applicantsTableBody.innerHTML = ''; // Clear the table before populating

    if (!snapshot.empty) {
        snapshot.forEach((doc) => {
            const row = renderRow(doc); // Create the row HTML
            applicantsTableBody.insertAdjacentHTML('beforeend', row); // Append the row to the table body
        });

        // Attach event listeners to delete buttons
        attachDeleteEventListeners();
    } else {
        applicantsTableBody.innerHTML = `<tr><td colspan="8">No accredited applicants found.</td></tr>`;
    }
});

// Function to delete an applicant from Firestore
async function deleteApplicant(applicantId) {
    const applicantRef = doc(db, 'student-org-applications', applicantId);
    try {
        await deleteDoc(applicantRef);
        console.log(`Applicant with ID ${applicantId} deleted successfully.`);
    } catch (error) {
        console.error("Error deleting applicant: ", error);
    }
}

// Attach event listeners to delete buttons
function attachDeleteEventListeners() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const applicantId = button.getAttribute('data-id');

            // Show SweetAlert confirmation dialog
            Swal.fire({
                title: 'Are you sure?',
                text: "This will permanently delete the applicant's record.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                customClass: 'swal-delete'
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteApplicant(applicantId); // Proceed with deletion
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'The applicant has been deleted.',
                        icon: 'success',
                        customClass: 'swal-success'
                    });
                }
            });
        });
    });
}
