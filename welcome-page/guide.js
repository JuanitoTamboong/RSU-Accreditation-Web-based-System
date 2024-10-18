import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js"; 
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";

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
const auth = getAuth(app);

// Redirect unauthenticated users
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html"; // Redirect to login page
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const guideSelector = document.getElementById('guide-selector');
    const guideList = document.getElementById('guide-list');
    const proceedBtn = document.getElementById('proceed-btn');

    guideSelector.addEventListener('change', async function() {
        guideList.innerHTML = ''; // Clear current list items
        proceedBtn.disabled = true; // Disable the proceed button initially

        if (this.value === '') {
            Swal.fire({
                icon: 'info',
                title: 'Select Accreditation Type',
                text: 'Please select an accreditation type to see the requirements.',
                customClass: "swal-wide",
            });
            return;
        }

        if (this.value === 're-accreditation') {
            await handleReAccreditation();
        } else if (this.value === 'new-organization') {
            // Directly load the guide items for new organization
            addGuideItems([
                "Accomplish the application",
                "Letter of application stating the purpose of accreditation",
                "Recommendation from the SSC President",
                "List of officers and their respective positions",
                "Letter of invitation to chosen faculty adviser",
                "Faculty adviser’s letter of acceptance of responsibility",
                "Proposed activities and project for one year",
                "Constitution and By-laws (include Anti-Hazing)",
                "Parent’s Consent (For Fraternity/Sorority)",
                "Documents should be submitted in four copies"
            ]);
            localStorage.removeItem('orgData'); // Clear any existing organization data
        }
    });

    async function handleReAccreditation() {
        const { value: formValues } = await Swal.fire({
            title: 'Re-Accreditation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto;">
                    <div style="margin-bottom: 20px; text-align:left;">
                        <label for="organization-search" style="display: block; margin-bottom: 5px;">Search Organization:</label>
                        <p style="font-size:15px;color:#597d9b;">use uppercase ex. CCMADI</p>
                        <input type="text" id="organization-search" class="swal2-input" placeholder="Enter organization name" required style="width: 100%; padding: 10px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 20px; text-align:left;">
                        <label for="filing-date" style="display: block; margin-bottom: 5px;">Date of Filing:</label>
                        <input type="text" id="filing-date" class="swal2-input" readonly style="background-color: #f0f0f0; width: 100%; padding: 10px; box-sizing: border-box;">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Search',
            customClass: {
                popup: 'swal-custom-popup',
                title: 'swal-title',
                input: 'swal-input',
                confirmButton: 'swal-confirm-btn',
                cancelButton: 'swal-cancel-btn',
            },
            preConfirm: async () => {
                const organizationName = document.getElementById('organization-search').value.trim();
                const filingDateInput = document.getElementById('filing-date');

                if (!organizationName) {
                    Swal.showValidationMessage('Please fill out the organization name');
                    return false;
                }

                console.log('Searching for organization:', organizationName);

                // Query Firestore based on the organization name
                const orgQuery = query(collection(db, "student-org-applications"), where("applicationDetails.organizationName", "==", organizationName));

                try {
                    const querySnapshot = await getDocs(orgQuery);
                    if (!querySnapshot.empty) {
                        const orgData = querySnapshot.docs[0].data();
                        filingDateInput.value = orgData.applicationDetails.dateFiling; // Populate filing date
                        console.log('Organization Data:', orgData);

                        // Store the organization data in local storage
                        localStorage.setItem('orgData', JSON.stringify(orgData));
                        localStorage.setItem('filingDate', orgData.applicationDetails.dateFiling);
                        
                        await new Promise(resolve => setTimeout(resolve, 3000)); // Delay before closing modal
                        return { orgData, filingDate: orgData.applicationDetails.dateFiling };
                    } else {
                        Swal.showValidationMessage('Organization not found');
                        return false;
                    }
                } catch (error) {
                    console.error("Error getting documents: ", error);
                    Swal.showValidationMessage('Error accessing Firestore: ' + error.message);
                    return false;
                }
            }
        });

        if (formValues) {
            const { orgData, filingDate } = formValues;
            console.log('Organization:', orgData.applicationDetails.organizationName);
            console.log('Date of Filing:', filingDate);

            // Load the guide items after the search
            addGuideItems([
                "Accomplish the application form (Re-Accreditation)",
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
            ]);
        }
    }

    function addGuideItems(items) {
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<input type="checkbox" class="guide-checkbox"> ${item}`;
            guideList.appendChild(li);
        });
        enableCheckboxes(); // Attach change event listener for checkboxes
    }

    function enableCheckboxes() {
        const checkboxes = document.querySelectorAll('.guide-checkbox');
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('change', function() {
                const atLeastOneChecked = Array.from(checkboxes).some(cb => cb.checked);
                proceedBtn.disabled = !atLeastOneChecked; // Enable button if at least one checkbox is checked
            });
        });
    }

    proceedBtn.addEventListener('click', async function() {
        const checkboxes = document.querySelectorAll('.guide-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);

        if (!allChecked) {
            Swal.fire({
                icon: 'error',
                title: 'Incomplete Requirements',
                text: 'Please complete all requirements before proceeding.',
                customClass: {
                    popup: "swal-wide",
                    backdrop: "swal-gif",
                }
            });
        } else {
            const selectedOption = guideSelector.value;

            // Fetch organization data (if needed) before proceeding
            if (selectedOption === 're-accreditation') {
                const orgData = JSON.parse(localStorage.getItem('orgData'));
                if (orgData) {
                    console.log('Organization Data:', orgData);

                    // Store organization data in localStorage for use on the next page
                    localStorage.setItem('selectedOrganization', JSON.stringify(orgData));

                    Swal.fire({
                        icon: 'success',
                        title: 'Data Fetched',
                        text: 'Organization data fetched successfully. Proceeding to the next page.',
                        timer: 2000,
                        willClose: () => {
                            // Redirect after success
                            window.location.href = '../application-form/re-accreditation-form.html';
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Organization Data Not Found',
                        text: 'Please search for an organization first.',
                    });
                }
            } else {
                // For new organization, proceed without fetching extra data
                Swal.fire({
                    icon: 'success',
                    title: 'Proceeding',
                    text: 'Proceeding to the application form for New Organization.',
                    timer: 2000,
                    willClose: () => {
                        window.location.href = '../application-form/new-organization-form.html'; // Redirect for new organization
                    }
                });
            }
        }
    });
    window.onload = function() {
        Swal.fire({
            title: 'Welcome!',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <img src="../assets/welcome-student.png" alt="Custom image" width="150" height="150" style="border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); margin-bottom: 15px;">
                    <p style="font-size: 14px; text-align:center; max-width: 100%;">
                       Please make sure to follow all the important requirements for getting accredited and re-accredited. It is very important to look at each guideline carefully and make sure you meet all the necessary steps. This will help us stay on the right path and meet the standards we need during this process. Thank you!
                    </p>
                </div>
                <audio autoplay preload="auto">
                    <source src="../assets/script.mp3" type="audio/mpeg">
                </audio>
            `,
            confirmButtonText: 'Got it'
        });
    };
});
