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
let typeOfService; // New global variable for accreditation type

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
        typeOfService = applicationDetails.typeOfService || 'N/A'; 

        // Render applicant details
        document.getElementById('applicant-details').innerHTML = `
            <p><strong>Student ID:</strong> ${applicationDetails.representativeId || 'N/A'}</p>
            <p><strong>Representative Name:</strong> ${applicationDetails.representativeName || 'N/A'}</p>
            <p><strong>Position:</strong> ${applicationDetails.representativePosition || 'N/A'}</p>
            <p><strong>School Year:</strong> ${applicationDetails.schoolYear || 'N/A'}</p>
            <p><strong>Course:</strong> ${applicationDetails.studentCourse || 'N/A'}</p>
            <p><strong>Organization Name:</strong> ${applicationDetails.organizationName || 'N/A'}</p>
            <p><strong>Email Address:</strong> ${applicationDetails.emailAddress || 'N/A'}</p>
            <p><strong>Type of Service:</strong> ${typeOfService}</p>
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

        // Render checklist based on type of Service
        renderChecklist(typeOfService, documents);

        // Render officer profiles if available
        const profiles = data.profiles || [];
        const officersHTML = profiles.map(profile => `
            <div class="officer">
                <img src="${profile.imageUrl}" alt="${profile.name}" style="width: 100px; height: 100px; border-radius: 50%;">
                <p><strong>Name:</strong> ${profile.name || 'N/A'}</p>
                <p><strong>Student ID:</strong> ${profile.studentId || 'N/A'}</p>
                <p><strong>Address:</strong> ${profile.address || 'N/A'}</p>
                <p><strong>Position:</strong> ${profile.position || 'N/A'}</p>
            </div>
        `).join('');
        document.getElementById('officers-details').innerHTML = officersHTML || '<p>No profiles available.</p>';

    } catch (error) {
        console.error("Error fetching applicant details:", error);
        document.getElementById('applicant-details').innerHTML = '<p>Error loading applicant details.</p>';
    }
}

let uncheckedDocuments = [];
// Function to render checklist based on accreditation type and submitted documents
function renderChecklist(serviceType, submittedDocuments) {
    let requiredDocuments;
    if (serviceType === 'Accreditation') {
        requiredDocuments = [
            "Accomplished the application",
            "Letter of application stating the purpose of accreditation",
            "Recommendation from the SSC President",
            "List of officers and their respective positions",
            "Letter of invitation to chosen faculty adviser",
            "Faculty adviser’s letter of acceptance of responsibility",
            "Proposed activities and project for one year",
            "Constitution and By-laws (include Anti-Hazing)",
            "Parent’s Consent (For Fraternity/Sorority)",
        ];
    } else if (serviceType === 'Renewal') {
        requiredDocuments = [
            "Accomplished the application form (Re-Accreditation)",
            "Letter of application stating the purpose of accreditation",
            "Recommendation from the SSC President",
            "List of officers and their respective positions",
            "Letter of invitation to chosen faculty adviser",
            "Faculty adviser’s letter of acceptance",
            "Photocopy of Certificate of Recognition",
            "Photo of certificate of attendance",
            "Financial statement for the previous year",
            "Proposed activities and project for one year",
            "Constitution and By-laws (include Anti-Hazing)",
            "Parent’s Consent (For Fraternity/Sorority)"
        ];
    } else {
        requiredDocuments = [];
    }

    uncheckedDocuments = requiredDocuments.filter(doc => !submittedDocuments.includes(doc));

    const checkListHTML = requiredDocuments.map(doc => {
        const isPresent = submittedDocuments.includes(doc);

        return `
            <label>
                <input type="checkbox" ${isPresent ? 'checked' : ''} data-document="${doc}"> 
                ${doc}
            </label>`;
    }).join('');

    document.getElementById('check-list').innerHTML = `
        <h2>Checklist</h2>
        <div class="checklist-container">${checkListHTML}</div>
    `;

    document.querySelectorAll('.checklist-container input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            updateUncheckedItems(event.target.dataset.document, event.target.checked);
        });
    });
}

// Function to update unchecked items as checkboxes are toggled
function updateUncheckedItems(doc, isChecked) {
    if (isChecked) {
        uncheckedDocuments = uncheckedDocuments.filter(item => item !== doc);
    } else {
        uncheckedDocuments.push(doc);
    }
}

// Show the email modal
function showModal() {
    document.getElementById('to_name').textContent = applicantName;
    document.getElementById('fsender_email').textContent = senderEmail;
    document.getElementById('application_status').textContent = applicationStatus;
    document.getElementById('emailStatus').textContent = ''; // Reset email status message
    document.getElementById('additional-message').value = ''; // Reset additional message textarea

    // Format missing documents as a bulleted list for better readability
    if (applicationStatus === 'Pending' && uncheckedDocuments.length > 0) {
        const missingDocsList = uncheckedDocuments.map(doc => `• ${doc}`).join('\n');
        document.getElementById('additional-message').value = `Missing documents:\n${missingDocsList}`;
    }

    document.getElementById('emailModal').style.display = 'block';
}

// Get references to the email modal elements
const sendEmailButton = document.getElementById('send-email-button');

// Function to send email
async function sendEmail(applicantId) {
    // Check if the button is already disabled (i.e., if email is being sent)
    if (sendEmailButton.disabled) return;

    sendEmailButton.disabled = true;
    sendEmailButton.innerHTML = '<span class="spinner"></span> Sending...';

    // Adjust custom message based on the application status
    const customMessage = applicationStatus === 'Approved'
        ? ' Please submit 4 copies of your documents.'
        : '';

    const emailParams = {
        to_name: applicantName,
        sender_email: senderEmail,
        from_name: 'Osas Admin',
        status_color: applicationStatus === 'Approved' ? 'green' : 'red',
        typeOfService: typeOfService,
        application_status: applicationStatus,
        custom_message: customMessage,
        additional_message: document.getElementById('additional-message').value.trim(),
    };

    try {
        const response = await emailjs.send('service_vsx36ej', 'template_7y6pol8', emailParams);
        console.log('Email sent successfully:', response);
        const currentDateTime = new Date();
        const formattedDateApproved = currentDateTime.toLocaleString('en-US', { 
            month: '2-digit', day: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        });

        const docRef = doc(db, 'student-org-applications', applicantId);
        await updateDoc(docRef, {
            applicationStatus: applicationStatus,
            formattedDateApproved: formattedDateApproved,
        });
        sendEmailButton.innerHTML = 'Email Sent!';
        sendEmailButton.style.color = 'white';
    } catch (error) {
        console.error('Error sending email:', error);

        sendEmailButton.innerHTML = 'Send Failed. Try Again';
        sendEmailButton.style.color = 'red';
    } finally {
        setTimeout(() => {
            sendEmailButton.disabled = false;
            sendEmailButton.innerHTML = 'Send Email';
            sendEmailButton.style.color = '';
        }, 3000);
    }
}

// Remove duplicate event listener code
sendEmailButton.addEventListener('click', function () {
    const applicantId = getQueryParameter('id');
    if (applicantId) {
        sendEmail(applicantId);
    }
});

// Close modal
function closeModal() {
    document.getElementById('emailModal').style.display = 'none';
}

// Event listeners
document.getElementById('send-email-button').addEventListener('click', function() {
    const applicantId = getQueryParameter('id');
    sendEmail(applicantId);
});
document.getElementById('closeEmailModal').addEventListener('click', closeModal);
//approved
document.getElementById('approve-button').addEventListener('click', function () {
    // Check for any missing requirements
    if (uncheckedDocuments.length > 0) {
        // Show a popup listing the missing requirements
        showMissingDocumentsPopup(uncheckedDocuments);
        return;
    }

    // If all requirements are met, proceed with approval
    proceedWithApproval();
});

// Function to display a popup for missing documents
function showMissingDocumentsPopup(missingDocuments) {
    const uncheckedListHTML = missingDocuments
        .map(doc => `
            <li style="margin-bottom: 8px; display: flex; align-items: center;">
                <span style="color: #e74c3c; margin-right: 10px;">&#x2716;</span>
                ${doc}
            </li>`)
        .join('');

    Swal.fire({
        icon: 'error',
        title: 'Approval Blocked',
        html: `
            <div style="text-align: left;">
                <p style="margin-bottom: 10px; font-size: 16px;">The following required documents are missing:</p>
                <ul style="padding-left: 20px; list-style: none; font-size: 14px; color: #2c3e50;">
                    ${uncheckedListHTML}
                </ul>
            </div>
        `,
        confirmButtonText: 'OK, I will review',
        confirmButtonColor: '#e74c3c',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            confirmButton: 'custom-swal-button',
        },
    });
}

// Function to proceed with approval
function proceedWithApproval() {
    Swal.fire({
        icon: 'success',
        title: 'Requirements Complete',
        text: 'All requirements have been met. Do you want to proceed with the approval?',
        showCancelButton: true,
        confirmButtonText: 'Yes, Approve',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#2ecc71',
        cancelButtonColor: '#e74c3c',
        customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            confirmButton: 'custom-swal-button',
        },
    }).then((result) => {
        if (result.isConfirmed) {
            // Finalize the approval
            finalizeApproval();
        }
    });
}

// Function to finalize approval
function finalizeApproval() {
    applicationStatus = 'Approved';

    // Simulate showing an email modal or sending a notification
    showModal(); // Function to display your email/modal
}

//pending
document.getElementById('pending-button').addEventListener('click', function() {
    applicationStatus = 'Pending';
    showModal();
});


// Initial data fetch
fetchApplicantDetails();
