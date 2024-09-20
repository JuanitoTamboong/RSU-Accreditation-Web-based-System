// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
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
    }
});

// Function to construct the document URL
function getDocumentUrl(fileName) {
    return `https://firebasestorage.googleapis.com/v0/b/student-org-5d42a.appspot.com/o/requirements%2F${encodeURIComponent(fileName)}?alt=media`;
}

// Function to fetch and display applications
async function fetchApplications() {
    try {
        const querySnapshot = await getDocs(collection(db, 'student-org-applications'));
        
        console.log('Documents fetched:', querySnapshot.size);
        
        const approvedList = document.getElementById('approved-list');
        const declinedList = document.getElementById('declined-list');
        const pendingList = document.getElementById('pending-list');
        
        approvedList.innerHTML = '';
        declinedList.innerHTML = '';
        pendingList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Document Data:', data);

            const listItem = document.createElement('div');
            listItem.className = 'application-item';
            listItem.innerHTML = `
                <div class="application-info">
                    <p><strong>Representative Name:</strong> ${data.representativeName || 'N/A'}</p>
                    <p><strong>Organization Name:</strong> ${data.organizationName || 'N/A'}</p>
                    <p><strong>Email Address:</strong> ${data.emailAddress || 'N/A'}</p>
                    <p><strong>Representative Position:</strong> ${data.representativePosition || 'N/A'}</p>
                    <p><strong>Accreditation Type:</strong> ${data.accreditationType || 'N/A'}</p>
                    <p><strong>Date of Filing:</strong> ${data.dateFiling || 'N/A'}</p>
                    <p><strong>School Year:</strong> ${data.schoolYear || 'N/A'}</p>
                    <p><strong>Student Course:</strong> ${data.studentCourse || 'N/A'}</p>
                    <p><strong>Student ID:</strong> ${data.studentId || 'N/A'}</p>
                    <p><strong>Image:</strong> <a href="${data.imageUrl}" target="_blank">View Image</a></p>
                    <p><strong>Document URLs:</strong>${data.documents || 'N/A'}<\p>
            
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
