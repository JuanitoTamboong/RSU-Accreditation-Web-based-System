import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

// Variables to hold applicant data
let applicantName; 
let senderEmail; 
let applicationStatus; 
let customMessage; 
let additionalMessage; // New variable for additional message
let typeOfAccreditation; // New global variable for accreditation type

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

        console.log("Fetched application details:", applicationDetails);

        // Store typeOfAccreditation globally
        typeOfAccreditation = applicationDetails.typeOfAccreditation || 'N/A'; 

        // Render applicant details
        document.getElementById('applicant-details').innerHTML = `
            <p><strong>Representative Name:</strong> ${applicationDetails.representativeName || 'N/A'}</p>
            <p><strong>Position:</strong> ${applicationDetails.representativePosition || 'N/A'}</p>
            <p><strong>School Year:</strong> ${applicationDetails.schoolYear || 'N/A'}</p>
            <p><strong>Course:</strong> ${applicationDetails.studentCourse || 'N/A'}</p>
            <p><strong>Organization Name:</strong> ${applicationDetails.organizationName || 'N/A'}</p>
            <p><strong>Email Address:</strong> ${applicationDetails.emailAddress || 'N/A'}</p>
            <p><strong>Type of Accreditation:</strong> ${typeOfAccreditation}</p>
            <p><strong>Date of Filing:</strong> ${applicationDetails.dateFiling || 'N/A'}</p>
        `;

        senderEmail = applicationDetails.emailAddress || 'N/A';
        applicantName = applicationDetails.representativeName || 'N/A';

        // Render documents directly in an iframe
        const documents = applicationDetails.documents || [];
        const documentsHTML = documents.map(doc => `
            <div style="margin-bottom: 20px;">
                <h4>${doc.split('/').pop()}</h4>
                <iframe src="${doc}" style="width: 100%; min-height:100vh;" frameborder="0"></iframe>
            </div>
        `).join('');
        document.getElementById('request-documents').innerHTML = documentsHTML || '<p>No documents available.</p>';

        // Render checklist for missing documents
        const requiredDocuments = ["Document 1", "Document 2", "Document 3"];
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

// Show the email modal
function showModal() {
    document.getElementById('to_name').textContent = applicantName;
    document.getElementById('fsender_email').textContent = senderEmail;
    document.getElementById('application_status').textContent = applicationStatus;
    document.getElementById('custom_message').textContent = customMessage;
    
    // Clear previous email status messages (success/error)
    document.getElementById('emailStatus').textContent = ''; 
    
    // Clear the additional message textarea each time the modal is opened
    document.getElementById('additional-message').value = ''; 
    
    // Display the modal
    document.getElementById('emailModal').style.display = 'block';  
}

// Send email function
async function sendEmail(applicantId) {
    const emailParams = {
        to_name: applicantName,
        sender_email: senderEmail,
        from_name: 'Osas Admin',
        status_color: applicationStatus === 'Approved' ? 'green' : 'red', // Green for Approved, Red for Rejected
        typeOfAccreditation: typeOfAccreditation, // Include the accreditation type here
        application_status: applicationStatus || 'Approved',
        additional_message: document.getElementById('additional-message').value || '' // Get additional message
    };

    try {
        const response = await emailjs.send('service_vsx36ej', 'template_7y6pol8', emailParams);
        console.log('Email sent successfully:', response);
        
        // Get the current date and time for the approval/rejection
        const currentDateTime = new Date();
        
        // Update the Firestore document with application status and timestamp
        const docRef = doc(db, 'student-org-applications', applicantId);
        await updateDoc(docRef, {
            applicationStatus: applicationStatus, // Update application status
            statusUpdateTimestamp: currentDateTime.toISOString() // Store the exact date and time
        });

        // Show success message after email is sent
        document.getElementById('emailStatus').textContent = 'Email sent successfully!';
    } catch (error) {
        console.error('Error sending email:', error);
        
        // Show error message in case of failure
        document.getElementById('emailStatus').textContent = 'Error sending email.';
    }
}

// Close modal
function closeModal() {
    document.getElementById('emailModal').style.display = 'none';
}

// Event listeners
document.getElementById('send-email-button').addEventListener('click', function() {
    const applicantId = getQueryParameter('id'); // Get applicant ID
    sendEmail(applicantId);
});
document.getElementById('closeEmailModal').addEventListener('click', closeModal);

// Approve or reject buttons
document.getElementById('approve-button').addEventListener('click', function() {
    applicationStatus = 'Approved';
    customMessage = 'Congratulations! Your application has been approved.';
    showModal();
});

document.getElementById('reject-button').addEventListener('click', function() {
    applicationStatus = 'Rejected';
    customMessage = 'We regret to inform you that your application has been rejected.';
    showModal();
});

// Initial data fetch
fetchApplicantDetails();
