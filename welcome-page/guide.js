// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js"; 
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";

// Firebase Configuration
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
const auth = getAuth(app);

// Redirect unauthenticated users to login page
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html"; // Redirect to login page
    }
});

// Document loaded event
document.addEventListener('DOMContentLoaded', () => {
    setupSelectors();
    setupProceedButton();
    showWelcomeModal();
});

// Setup guide selector
function setupSelectors() {
    const guideSelector = document.getElementById('guide-selector');
    guideSelector.addEventListener('change', handleGuideSelection);
}

// Handle guide selection change
async function handleGuideSelection(event) {
    const guideList = document.getElementById('guide-list');
    const proceedBtn = document.getElementById('proceed-btn');
    guideList.innerHTML = ''; // Clear existing items
    proceedBtn.disabled = true;

    const selectedValue = event.target.value;

    if (!selectedValue) {
        showInfoAlert('Select Service Type', 'Please select a type of service to view the requirements..');
        return;
    }

    if (selectedValue === 're-accreditation') {
        await handleReAccreditation();
    } else if (selectedValue === 'new-organization') {
        displayGuideItems(newOrganizationItems());
        localStorage.removeItem('orgData'); // Clear existing organization data
    }
}

// Handle re-accreditation process
async function handleReAccreditation() {
    const organizationData = await getOrganizationData();
    if (organizationData) {
        displayGuideItems(reAccreditationItems());
    }
}

// Fetch organization data
async function getOrganizationData() {
    const user = auth.currentUser; // Get current user
    if (!user) {
        showInfoAlert('User Not Found', 'Please log in to search for your organization.');
        return null;
    }

    const { value: formValues } = await Swal.fire({
        title: 'Re-Accreditation',
        html: reAccreditationFormHTML(),
        showCancelButton: true,
        confirmButtonText: 'Search',
        preConfirm: async () => searchOrganizationData(user.uid),
        customClass: {
            confirmButton: 'swal-button swal-button-search',
            cancelButton: 'swal-button swal-button-cancel',
            actions: 'swal-actions',
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
        },
    });
    if (formValues) {
        const { orgData, filingDate } = formValues;
        console.log('Organization:', orgData.applicationDetails.organizationName);
        console.log('Date of Filing:', filingDate);
        return orgData;
    }
    return null;
}

// Re-accreditation form HTML
function reAccreditationFormHTML() {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px;">Search Organization by Name:</label>
                <input type="text" id="organization-name" class="swal2-input" placeholder="Enter organization name" required 
                       style="width: 100%; padding: 8px; box-sizing: border-box; text-transform: uppercase;">
                <div id="error-message" 
                     style="
                        margin-top: 20px; 
                        color: white; 
                        background-color: #ff4d4d; 
                        padding: 8px; 
                        border-radius: 5px; 
                        font-weight: bold; 
                        font-size: 13px; 
                        display: none;"> 
                </div>
            </div>
        </div>`;
}

// Search for organization data in Firestore
async function searchOrganizationData(uid) {
    const organizationName = document.getElementById('organization-name').value.trim().toUpperCase(); // Convert to uppercase for case-insensitive search
    const errorContainer = document.getElementById('error-message'); // Ensure there's an element with this ID

    // Clear and hide any previous error messages
    errorContainer.textContent = '';
    errorContainer.style.display = 'none';

    if (!organizationName) {
        errorContainer.textContent = 'Please fill out the organization name';
        errorContainer.style.display = 'block'; // Show the error message
        return false;
    }

    console.log("Searching for organization:", organizationName, "with UID:", uid);

    try {
        // Query Firestore to match organization name and UID
        const orgQuery = query(
            collection(db, "student-org-applications"),
            where("applicationDetails.organizationName", "==", organizationName),
            where("applicationDetails.uid", "==", uid)
        );

        const querySnapshot = await getDocs(orgQuery);

        if (!querySnapshot.empty) {
            const orgData = querySnapshot.docs[0].data();
            localStorage.setItem('orgData', JSON.stringify(orgData)); // Store all organization data
            localStorage.setItem('filingDate', orgData.applicationDetails.dateFiling);
            console.log('Organization Data:', orgData);

            // Clear and hide any error messages on success
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';

            // Show a success alert with the date of filing
            await Swal.fire({
                icon: 'success',
                title: 'Organization Found!',
                html: `
                    <p>Organization Name: ${orgData.applicationDetails.organizationName}</p>
                    <p>Date of Filing: ${orgData.applicationDetails.dateFiling}</p>
                `,
                confirmButtonText: 'Okay'
            });
            return { orgData, filingDate: orgData.applicationDetails.dateFiling };
        } else {
            errorContainer.textContent = 'Organization not found or you do not have access';
            errorContainer.style.display = 'block'; // Show the error message
            return false;
        }
    } catch (error) {
        console.error("Error fetching organization data:", error); // Log error to console
        errorContainer.textContent = 'Error accessing Firestore: ' + error.message;
        errorContainer.style.display = 'block'; // Show the error message
        return false;
    }
}

// Display guide items based on selected accreditation type
function displayGuideItems(items) {
    const guideList = document.getElementById('guide-list');
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<input type="checkbox" class="guide-checkbox"> ${item}`;
        guideList.appendChild(li);
    });
    enableCheckboxes();
}

// Enable checkbox state management
function enableCheckboxes() {
    const checkboxes = document.querySelectorAll('.guide-checkbox');
    const proceedBtn = document.getElementById('proceed-btn');
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            const atLeastOneChecked = Array.from(checkboxes).some(cb => cb.checked);
            proceedBtn.disabled = !atLeastOneChecked;
        });
    });
}

// Setup proceed button functionality
function setupProceedButton() {
    const proceedBtn = document.getElementById('proceed-btn');
    proceedBtn.addEventListener('click', handleProceedButtonClick);
}

// Handle proceed button click
async function handleProceedButtonClick() {
    const checkboxes = document.querySelectorAll('.guide-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    if (!allChecked) {
        // Show the alert if not all requirements are checked
        showInfoAlert('Incomplete Requirements', 'Please complete all requirements before proceeding.');
        return; // Exit the function if not all are checked
    }

    const selectedOption = document.getElementById('guide-selector').value;
    if (selectedOption === 're-accreditation') {
        const orgData = JSON.parse(localStorage.getItem('orgData'));
        const filingDate = localStorage.getItem('filingDate');

        if (orgData) {
            localStorage.setItem('selectedOrganization', JSON.stringify(orgData));
            // Store selected organization data in localStorage
            showSuccessAlert(
                'Data Fetched',
                `Organization data fetched successfully. Filing Date: ${filingDate}. Proceeding to the next page.`,
                '../application-form/re-accreditation-form.html'
            );
        } else {
            showInfoAlert('Organization Data Not Found', 'Please search for an organization first.');
        }
    } else {
        showSuccessAlert('Proceeding', 'Proceeding to the application form for New Organization...', '../application-form/new-organization-form.html');
    }
}

// Define new organization items
function newOrganizationItems() {
    return [
        "Accomplish the application",
        "Letter of application stating the purpose of accreditation",
        "Recommendation from the SSC President",
        "List of officers and their respective positions",
        "Letter of invitation to chosen faculty adviser",
        "Faculty adviser’s letter of acceptance of responsibility",
        "Proposed activities and project for one year",
        "Constitution and By-laws (include Anti-Hazing)",
        "Parent’s Consent (For Fraternity/Sorority)",
    ];
}
function reAccreditationItems() {
    return [
        "Accomplish the application form (Re-Accreditation)",
        "Letter of application stating the purpose of accreditation",
        "Recommendation from the SSC President",
        "List of officers and their respective positions",
        "Letter of invitation to chosen faculty adviser",
        "Faculty adviser’s letter of acceptance",
        "Photo of certificate of attendance",
        "Financial statement for the previous year",
        "Proposed activities and project for one year",
        "Constitution and By-laws (include Anti-Hazing)",
        "Parent’s Consent (For Fraternity/Sorority)"
    ];
}
function showWelcomeModal() {
    Swal.fire({
        title: 'Welcome!',
        html: `
                <div style="display: flex; flex-direction: column; align-items: center; letter-spacing:1px;">
                    <img src="../assets/welcome-student.png" alt="Custom image" width="150" height="150" style="border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); margin-bottom: 15px;">
                    <p style="font-size: 14px; text-align:center; max-width: 100%;">
                       please make sure to follow all the important requirements for getting accredited and re-accredited. It is very important to look at each guideline carefully and make sure you meet all the necessary steps. This will help us stay on the right path and meet the standards we need during this process. Thank you!
                    </p>
                </div>
                <audio autoplay preload="auto">
                    <source src="../assets/script.mp3" type="audio/mpeg">
                </audio>
        `,
        showCloseButton: true,
        confirmButtonText: 'Got it!'
    });
}

function showSuccessAlert(title, text, redirectUrl) {
    Swal.fire({
        icon: 'success',
        title: title,
        text: text,
        confirmButtonText: 'Proceed'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = redirectUrl; // Redirect to the specified URL
        }
    });
}

function showInfoAlert(title, text) {
    Swal.fire({
        icon: 'info',
        title: title,
        text: text,
        confirmButtonText: 'Okay'
    });
}