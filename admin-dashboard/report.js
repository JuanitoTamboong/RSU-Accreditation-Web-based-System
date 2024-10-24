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

// Reference to the Firestore collection
const reportsRef = collection(db, 'student-org-applications');

// Function to fetch and display data
onSnapshot(reportsRef, (snapshot) => {
    const reportsTableBody = document.getElementById('reports-table-body');
    reportsTableBody.innerHTML = ''; // Clear existing data

    snapshot.forEach(doc => {
        const data = doc.data();
        const applicationDetails = data.applicationDetails || {}; // Access applicationDetails

        console.log("Document data: ", data); // Log the document data
        const row = `
            <tr>
                <td>${applicationDetails.emailAddress || 'N/A'}</td>
                <td>${applicationDetails.representativeName || 'N/A'}</td>
                <td>${applicationDetails.organizationName || 'N/A'}</td>
                <td>${applicationDetails.typeOfAccreditation || 'N/A'}</td>
                <td>${applicationDetails.dateFiling || 'N/A'}</td>
                <td>${data.applicationStatus || 'N/A'}</td>
                <td><button class="view-button" data-id="${doc.id}">View</button></td>
                <td><button class="delete-button" data-id="${doc.id}">Delete</button></td>
                <td><button class="download-button" data-id="${doc.id}">Download</button></td>
            </tr>
        `;
        reportsTableBody.insertAdjacentHTML('beforeend', row);
    });

    // Attach event listeners for view and delete buttons
    document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', () => viewDetails(button.dataset.id));
    });

    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => deleteReport(button.dataset.id));
    });
});

// Function to view report details
function viewDetails(id) {
    const reportDoc = doc(db, 'student-org-applications', id); // Ensure you're using the right collection here
    onSnapshot(reportDoc, (doc) => {
        const data = doc.data();

        if (data) {
            const applicationDetails = data.applicationDetails || {}; // Access applicationDetails

            const modalDetails = document.getElementById('modal-details');
            modalDetails.innerHTML = `
                <p>Email: ${applicationDetails.emailAddress || 'N/A'}</p>
                <p>Representative Name: ${applicationDetails.representativeName || 'N/A'}</p>
                <p>Organization Name: ${applicationDetails.organizationName || 'N/A'}</p>
                <p>Type of Accreditation: ${applicationDetails.typeOfAccreditation || 'N/A'}</p>
                <p>Date of Filing: ${applicationDetails.dateFiling || 'N/A'}</p>
                <p>Status: ${data.applicationStatus || 'N/A'}</p>
            `;
            document.getElementById('details-modal').classList.remove('hidden');

            // Download button for PDF
            document.getElementById('download-file').onclick = () => downloadReport(applicationDetails);
        } else {
            console.error('No such document!');
        }
    });
}

// Function to delete a report
async function deleteReport(id) {
    const confirmDelete = confirm("Are you sure you want to delete this report?");
    if (confirmDelete) {
        await deleteDoc(doc(db, 'student-org-applications', id)); // Ensure you're using the right collection here
        alert('Report deleted successfully.');
    }
}

// Close modal when clicking on the close button
document.querySelector('.close').onclick = () => {
    document.getElementById('details-modal').classList.add('hidden');
};

// Function to download report as PDF
function downloadReport(applicationDetails) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text(`Email: ${applicationDetails.emailAddress || 'N/A'}`, 10, 10);
    doc.text(`Representative Name: ${applicationDetails.representativeName || 'N/A'}`, 10, 20);
    doc.text(`Organization Name: ${applicationDetails.organizationName || 'N/A'}`, 10, 30);
    doc.text(`Type of Accreditation: ${applicationDetails.typeOfAccreditation || 'N/A'}`, 10, 40);
    doc.text(`Date of Filing: ${applicationDetails.dateFiling || 'N/A'}`, 10, 50);
    doc.text(`Status: ${applicationDetails.applicationStatus || 'N/A'}`, 10, 60);

    doc.save(`${applicationDetails.organizationName || 'Report'}.pdf`);
}
