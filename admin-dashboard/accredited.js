// Import Firebase modules
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getStorage, ref, deleteObject } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';

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
const storage = getStorage(app);

// Function to format date strings
function formatDateString(dateString, includeTime = false) {
    const date = new Date(dateString);
    
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    let formattedDate = date.toLocaleDateString('en-US', options); // Format sample "November 24, 2024"
    
    if (includeTime) {
        const timeOptions = { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        };
        const time = date.toLocaleTimeString('en-US', timeOptions); // Format sample  ganurnnn "12:52 AM"
        formattedDate += `, ${time}`; // Append time to the formatted date
    }

    return formattedDate;
}

// Function to render a table row for accredited applicants
function renderRow(doc) {
    const data = doc.data();
    const applicantId = doc.id;

    const {
        applicationStatus = 'N/A',
        formattedDateApproved = 'N/A',
        applicationDetails = {}
    } = data;

    const {
        organizationName = 'N/A',
        representativeName = 'N/A',
        emailAddress = 'N/A',
        typeOfService = 'N/A',
        dateFiling = 'N/A',
    } = applicationDetails;

    const formattedDateFiling = formatDateString(dateFiling); // Format for "Date of Filing"
    const formattedApprovedDate = formatDateString(formattedDateApproved, true); // Format for "Date Approved"

    return `
        <tr data-id="${applicantId}">
            <td>${organizationName}</td>
            <td>${representativeName}</td>
            <td>${emailAddress}</td>
            <td>${typeOfService}</td>
            <td>${formattedDateFiling}</td>
            <td>${formattedApprovedDate}</td>
            <td>${applicationStatus}</td>
            <td>
                <button class="delete-btn" data-id="${applicantId}">Delete</button>
            </td>
        </tr>
    `;
}

// Fetch data and render the table
const applicantsRef = collection(db, 'student-org-applications');
const approvedQuery = query(applicantsRef, where("applicationStatus", "==", "Approved"));

onSnapshot(approvedQuery, (snapshot) => {
    const applicantsTableBody = document.getElementById('applicants-table-body');
    applicantsTableBody.innerHTML = ''; // Clear the table

    if (!snapshot.empty) {
        // Extract documents and sort them by 'formattedDateApproved'
        const sortedDocs = [...snapshot.docs].sort((a, b) => {
            const dateA = new Date(a.data().formattedDateApproved || 0);
            const dateB = new Date(b.data().formattedDateApproved || 0);
            return dateB - dateA; // Descending order
        });

        // Render sorted rows
        sortedDocs.forEach((doc) => {
            const row = renderRow(doc);
            applicantsTableBody.insertAdjacentHTML('beforeend', row);
        });

        attachDeleteEventListeners(); // Add delete functionality
    } else {
        applicantsTableBody.innerHTML = `<tr><td colspan="8">No accredited applicants found.</td></tr>`;
    }
});

// Function to delete files from Firebase Storage
async function deleteFiles(fileUrls) {
    const promises = fileUrls.map(async (url) => {
        try {
            // Decode the file path from the URL
            const filePath = decodeURIComponent(new URL(url).pathname.split('/o/')[1]);

            // Create a reference to the file in Firebase Storage
            const fileRef = ref(storage, filePath);

            // Delete the file
            await deleteObject(fileRef);
            console.log(`Deleted file: ${url}`);
        } catch (error) {
            console.error(`Failed to delete file: ${url}`, error);
        }
    });
    return Promise.all(promises);
}

// Function to handle document and associated files deletion
function attachDeleteEventListeners() {
    const tableBody = document.getElementById('applicants-table-body');

    tableBody.addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('.delete-btn');
        if (!deleteBtn) return;

        const requestId = deleteBtn.getAttribute('data-id');
        console.log("Deleting request ID:", requestId);

        if (!requestId) return;

        // Show confirmation dialog
        const { isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            customClass: 'swal-pop-up',
        });

        if (!isConfirmed) return;

        try {
            const docRef = doc(db, 'student-org-applications', requestId);
            const docSnapshot = await getDoc(docRef);  // Use getDoc to fetch the document snapshot

            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const documentUrls = data?.applicationDetails?.documents || [];
                const imageUrls = data?.profiles?.map(profile => profile.imageUrl) || [];

                // Delete associated files
                await deleteFiles([...documentUrls, ...imageUrls]);

                // Delete Firestore document
                await deleteDoc(docRef);

                // Custom success alert
                Swal.fire({
                    title: 'Deleted!',
                    text: 'The request and associated files have been deleted.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    customClass: 'swal-delete',
                });
            } else {
                throw new Error("Document not found");
            }
        } catch (error) {
            console.error("Error deleting request:", error);
            Swal.fire('Error!', 'Failed to delete the request. Please try again.', 'error');
        }
    });
}
