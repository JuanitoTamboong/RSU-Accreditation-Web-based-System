// Import Firebase
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

document.addEventListener('DOMContentLoaded', function () {
    const guideSelector = document.getElementById('guide-selector');
    const guideList = document.getElementById('guide-list');
    const proceedBtn = document.getElementById('proceed-btn');

    guideSelector.addEventListener('change', async function () {
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
            const { value: formValues } = await Swal.fire({
                title: 'Re-Accreditation',
                html: `
                    <div style="text-align: left;">
                        <label for="organization-search">Search Organization:</label>
                        <input type="text" id="organization-search" class="swal2-input" placeholder="Enter organization name" required>
                        <label for="filing-date">Date of Filing:</label>
                        <input type="text" id="filing-date" class="swal2-input" readonly> <!-- Make this field read-only -->
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Search',
                customClass: {
                    popup: 'swal-custom-popup'
                },
                preConfirm: async () => {
                    const organizationName = document.getElementById('organization-search').value.trim();
                    const filingDateInput = document.getElementById('filing-date');

                    if (!organizationName) {
                        Swal.showValidationMessage('Please fill out the organization name');
                        return false;
                    }

                    const currentUser = auth.currentUser;
                    if (!currentUser) {
                        console.error("User is not authenticated");
                        Swal.showValidationMessage('User is not authenticated.');
                        return;
                    }

                    const currentUserId = currentUser.uid;
                    console.log("Current user ID:", currentUserId);

                    // Query Firebase Firestore to get the organization based on the search
                    const orgQuery = query(
                        collection(db, "student-org-applications"),
                        where("organizationName", "==", organizationName),
                        where("createdBy", "==", currentUserId) // Ensure this matches the UID of the logged-in user
                    );

                    try {
                        console.log("Searching for organization:", organizationName);

                        const querySnapshot = await getDocs(orgQuery);
                        console.log("Query snapshot size:", querySnapshot.size);
                        console.log("Query snapshot data:", querySnapshot.docs.map(doc => doc.data()));

                        // If the organization exists, check if it belongs to the current user
                        if (!querySnapshot.empty) {
                            const orgData = querySnapshot.docs[0].data();
                            filingDateInput.value = orgData.dateFiling; // Populate filing date
                            console.log('Found organization data:', orgData);

                            // Add a delay before closing the modal
                            await new Promise(resolve => setTimeout(resolve, 3000)); // 3000 ms = 3 seconds
                            return { orgData, filingDate: orgData.dateFiling };
                        } else {
                            Swal.showValidationMessage('Organization not found or does not belong to you.');
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
                console.log('Organization:', orgData.organizationName);
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
        } else {
            // For New Organization
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
        }
    });

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
            checkbox.addEventListener('change', function () {
                const atLeastOneChecked = Array.from(checkboxes).some(cb => cb.checked);
                proceedBtn.disabled = !atLeastOneChecked; // Enable button if at least one is checked
            });
        });
    }

    proceedBtn.addEventListener('click', function () {
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
            const redirectUrl = selectedOption === 'new-organization'
                ? '../application-form/homepage.html'
                : '../student-profile/list-officers.html';
            window.location.href = redirectUrl;
        }
    });

    window.onload = function () {
        Swal.fire({
            title: 'Welcome!',
            html: `
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <img src="../assets/welcome-student.png" alt="Custom image" width="150" height="150" style="border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1); margin-bottom: 15px;">
                    <p style="font-size: 14px; text-align:center; max-width: 100%;">
                        Please make sure to follow all the important requirements for getting accredited and re-accredited. It is very important to look at each guideline carefully and make sure you meet all the necessary requirements.
                    </p>
                </div>
                <audio autoplay preload="auto">
                    <source src="../assets/script.mp3" type="audio/mpeg">
                </audio>
            `,
            confirmButtonText: 'Proceed'
        });
    };
});
