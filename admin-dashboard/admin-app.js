// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

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
const auth = getAuth();

// Check if the user is authenticated
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user.uid);
        fetchApplications(); // Fetch applications only if logged in
    } else {
        console.log('User is not logged in');
        // Optionally redirect to login or show an error message
    }
});

// Function to fetch applications from Firestore
async function fetchApplications() {
    try {
        console.log('Fetching applications...');
        const querySnapshot = await getDocs(collection(db, 'student-org-applications'));

        console.log('Documents fetched:', querySnapshot.size);

        const approvedList = document.getElementById('approved-list');
        const declinedList = document.getElementById('declined-list');
        const pendingList = document.getElementById('pending-list');

        approvedList.innerHTML = '';
        declinedList.innerHTML = '';
        pendingList.innerHTML = '';

        if (querySnapshot.empty) {
            console.log('No applications found.');
            return; // Exit if no applications
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Document ID:', doc.id, 'Data:', data); // Log the document ID and its data

            const listItem = document.createElement('div');
            listItem.className = 'application-item';
            listItem.innerHTML = `
                <div class="application-info">
                    <p><strong>Representative Name:</strong> ${data.representativeName || 'N/A'}</p>
                    <p><strong>Organization Name:</strong> ${data.organizationName || 'N/A'}</p>
                    <p><strong>Email Address:</strong> ${data.emailAddress || 'N/A'}</p>
                    <p><strong>Representative Position:</strong> ${data.representativePosition || 'N/A'}</p>
                    <p><strong>Accreditation Type:</strong> ${data.typeOfAccreditation || 'N/A'}</p>
                    <p><strong>Date of Filing:</strong> ${data.dateFiling || 'N/A'}</p>
                    <p><strong>School Year:</strong> ${data.schoolYear || 'N/A'}</p>
                    <p><strong>Student Course:</strong> ${data.studentCourse || 'N/A'}</p>
                    <p><strong>Documents:</strong> ${Array.isArray(data.documents) && data.documents.length > 0 ? data.documents.join(', ') : 'N/A'}</p>
                </div>
                <div class="application-profiles">
                    <p><strong>Profiles:</strong></p>
                    <ul>
                        ${Array.isArray(data.profiles) && data.profiles.length > 0 ? data.profiles.map(profile => `
                            <li>
                                <p><strong>Name:</strong> ${profile.name || 'N/A'}</p>
                                <p><strong>Student ID:</strong> ${profile.studentId || 'N/A'}</p>
                                <p><strong>Address:</strong> ${profile.address || 'N/A'}</p>
                                <p><strong>Image:</strong> <a href="${profile.imageUrl || '#'}" target="_blank">View Image</a></p>
                            </li>
                        `).join('') : '<li>No profiles available</li>'}
                    </ul>
                </div>
                <div class="application-actions">
                    <button onclick="approveApplication('${doc.id}')">Approve</button>
                    <button onclick="declineApplication('${doc.id}')">Decline</button>
                </div>
            `;

            // Categorize based on status
            if (data.status === 'approved') {
                approvedList.appendChild(listItem);
            } else if (data.status === 'declined') {
                declinedList.appendChild(listItem);
            } else {
                pendingList.appendChild(listItem);
            }
        });
    } catch (error) {
        console.error('Error fetching applications:', error);
    }
}

// Function to submit an application (modify as per your form submission)
async function submitApplication(representativeName, organizationName, profiles) {
    const docRef = doc(collection(db, 'student-org-applications'));
    await setDoc(docRef, {
        representativeName: representativeName,
        organizationName: organizationName,
        profiles: profiles, // Ensure profiles are correctly set
        status: 'pending', // or whatever status is applicable
    });
}
