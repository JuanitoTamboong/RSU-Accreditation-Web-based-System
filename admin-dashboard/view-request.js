import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

// Function to get the query parameter from the URL
function getQueryParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Fetch and render applicant details
async function fetchApplicantDetails() {
    const applicantId = getQueryParameter('id');
    if (!applicantId) {
        document.getElementById('applicant-details').innerHTML = '<p>Invalid request ID.</p>';
        return;
    }

    try {
        const docRef = doc(db, 'student-org-applications', applicantId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            document.getElementById('applicant-details').innerHTML = '<p>No such request found.</p>';
            return;
        }

        const data = docSnap.data();
        const applicationDetails = data.applicationDetails || {};

        // Render applicant details
        document.getElementById('applicant-details').innerHTML = `
            <p><strong>Email Address:</strong> ${applicationDetails.emailAddress || 'N/A'}</p>
            <p><strong>Organization Name:</strong> ${applicationDetails.organizationName || 'N/A'}</p>
            <p><strong>Type of Accreditation:</strong> ${applicationDetails.typeOfAccreditation || 'N/A'}</p>
            <p><strong>Date of Filing:</strong> ${applicationDetails.dateFiling || 'N/A'}</p>
            <p><strong>Representative Name:</strong> ${applicationDetails.representativeName || 'N/A'}</p>
            <p><strong>Position:</strong> ${applicationDetails.representativePosition || 'N/A'}</p>
            <p><strong>Course:</strong> ${applicationDetails.studentCourse || 'N/A'}</p>
        `;

        // Render documents directly in an iframe
        const documents = applicationDetails.documents || [];
        const documentsHTML = documents.map(doc => `
            <div style="margin-bottom: 20px;">
                <h4>${doc.split('/').pop()}</h4>
                <iframe src="${doc}" style="width: 100%; min-height: 100vh;" frameborder="0"></iframe>
            </div>
        `).join('');
        document.getElementById('request-documents').innerHTML = documentsHTML || '<p>No documents available.</p>';

        // Render checklist for missing documents
        const requiredDocuments = ["Document 1", "Document 2", "Document 3"]; // Example required documents
        const checkListHTML = requiredDocuments.map(doc => {
            const isPresent = documents.includes(doc);
            return `<p style="color: ${isPresent ? 'green' : 'red'};">${doc}: ${isPresent ? '✔️' : '❌'}</p>`;
        }).join('');
        document.getElementById('check-list').innerHTML = `<h2>Checklist</h2>${checkListHTML}`;

        // Render officer profiles if available
        const profiles = data.profiles || [];
        const officersHTML = profiles.map(profile => `
            <div class="officer">
                <img src="${profile.imageUrl}" alt="${profile.name}" style="width: 100px; height: 100px; border-radius: 50%;">
                <p><strong>Name:</strong> ${profile.name || 'N/A'}</p>
                <p><strong>Student ID:</strong> ${profile.studentId || 'N/A'}</p>
                <p><strong>Address:</strong> ${profile.address || 'N/A'}</p>
            </div>
        `).join('');
        document.getElementById('officers-details').innerHTML = officersHTML || '<p>No profiles available.</p>';

    } catch (error) {
        console.error("Error fetching applicant details:", error);
        document.getElementById('applicant-details').innerHTML = '<p>Error loading applicant details.</p>';
    }
}

// Event listener for Approve button
document.getElementById('approve-button').addEventListener('click', function() {
    document.getElementById('approvalModal').style.display = 'block';
});

// Event listener for closing the modal
document.getElementById('closeModal').addEventListener('click', function() {
    document.getElementById('approvalModal').style.display = 'none';
});

// Event listener for sending approval email
document.getElementById('sendApprovalEmail').addEventListener('click', function() {
    // Get the email address from the applicant details
    const emailElement = document.querySelector('.applicant-details p strong:nth-of-type(1)');
    const applicantEmail = emailElement ? emailElement.parentNode.textContent.split(':')[1].trim() : '';

    // Get the organization name
    const organizationElement = document.querySelector('.applicant-details p strong:nth-of-type(2)');
    const organizationName = organizationElement ? organizationElement.parentNode.textContent.split(':')[1].trim() : '';

    const subject = 'Application Approved';
    const body = `
        Dear Applicant,

        We are pleased to inform you that your application for accreditation with the ${organizationName} has been approved.

        Thank you for your submission.

        Best Regards,
        Osas Admin Team
    `;

    // Send the email
    if (applicantEmail) {
        window.open(`mailto:${applicantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } else {
        alert('Unable to send email: applicant email address is not available.');
    }

    document.getElementById('approvalModal').style.display = 'none'; // Close the modal
});


// Initialize when the DOM is loaded
window.addEventListener('DOMContentLoaded', fetchApplicantDetails);
