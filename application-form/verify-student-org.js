// Firebase initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, query, where, getDocs, addDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

// Firebase configuration
const firebaseConfigVerification = {
    apiKey: "AIzaSyDXQCFoaCSWsCV2JI7wrOGZPKEpQuNzENA",
    authDomain: "student-org-5d42a.firebaseapp.com",
    projectId: "student-org-5d42a",
    storageBucket: "student-org-5d42a.appspot.com",
    messagingSenderId: "1073695504078",
    appId: "1:1073695504078:web:eca07da6a1563c46e0829f"
};

const appVerification = initializeApp(firebaseConfigVerification, "verification");
const dbVerification = getFirestore(appVerification);
const storage = getStorage(appVerification);

// Format Student ID and trigger verification
window.formatStudentId = function(event) {
    const input = event.target.value.replace(/\D/g, ''); // Remove non-digit characters
    let formattedId = input;
    if (input.length > 3) formattedId = input.substring(0, 3) + '-' + input.substring(3);
    if (input.length > 8) formattedId = formattedId.substring(0, 8) + '-' + formattedId.substring(8);
    event.target.value = formattedId;
}

// Debounce function to delay verification
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced function for student ID verification
const debounceVerifyStudentId = debounce(async (studentID) => {
    const status = await verifyStudentId(studentID);
    if (status === "verified") {
        displayStatus('Verified student ID.', 'green');
    } else if (status === "unverified") {
        displayStatus('Unverified student ID, please wait for the admin to verify', 'orange');
        requestIDUpload(studentID); // Trigger upload for unverified students
    } else if (status === "no-record") {
        displayStatus('Student ID not found. Please submit or verify your ID.', 'red');
        requestIDUpload(studentID);  // Only trigger for students not found
    }
    listenForUnverifiedRequests(studentID);  // Start listening for real-time updates
}, 500);

// Display verification status
function displayStatus(message, color) {
    const statusElement = document.getElementById('verification-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = color;
    } else {
        console.error('Verification status element not found');
    }
}

// Verify if student ID exists and check its status (verified or unverified)
async function verifyStudentId(studentID) {
    // Check the unverified-requests collection first
    const studentRef = collection(dbVerification, 'unverified-requests');
    const q = query(studentRef, where("studentID", "==", studentID));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // The student ID exists in the unverified-requests collection
        const doc = querySnapshot.docs[0];
        const status = doc.data().status;
        if (status === "unverified") {
            return "unverified";  // Student is unverified
        } else {
            return "verified";  // Student is verified
        }
    } else {
        // Check the verified-students collection
        const verifiedRef = collection(dbVerification, 'verified-students');
        const verifiedQuery = query(verifiedRef, where("studentID", "==", studentID));
        const verifiedSnapshot = await getDocs(verifiedQuery);
        if (!verifiedSnapshot.empty) {
            return "verified";  // Student is verified
        } else {
            return "no-record";  // No record found
        }
    }
}

// Listen for changes in unverified-requests collection (real-time updates)
function listenForUnverifiedRequests(studentID) {
    const studentRef = collection(dbVerification, 'unverified-requests');
    const q = query(studentRef, where("studentID", "==", studentID));
    
    // Real-time listener for changes
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const status = doc.data().status;
            if (status === "unverified") {
                displayStatus('Unverified student ID, please wait for the admin to verify', 'orange');
                requestIDUpload(studentID);  // Trigger upload if unverified
            } else {
                displayStatus('Verified student ID.', 'green');
            }
        } else {
            displayStatus('Student ID not found. Please submit or verify your ID.', 'red');
            requestIDUpload(studentID); // Trigger upload for unregistered IDs
        }
    });
    
    // Return the unsubscribe function if you want to stop listening
    return unsubscribe;
}

// Request ID upload if the student ID is unverified or not found
async function requestIDUpload(studentID) {
    const studentRef = collection(dbVerification, 'unverified-requests');
    const q = query(studentRef, where("studentID", "==", studentID));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Trigger Swal if no request exists in 'unverified-requests'
        Swal.fire({
            title: 'ID Verification Required',
            text: 'Please upload a photo of your student ID for verification.',
            icon: 'info',
            input: 'file',
            inputAttributes: { accept: 'image/*' },
            showCancelButton: true,
            confirmButtonText: 'Upload',
            cancelButtonText: 'Use Camera',
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                const file = result.value;
                await uploadIDImage(file, studentID);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                captureImageWithCamera(studentID);
            }
        });
    }
}

// Upload ID photo to Firebase Storage
async function uploadIDImage(file, studentID) {
    const storageRef = ref(storage, `unverified-ids/${studentID}.jpg`);
    await uploadBytes(storageRef, file);
    await addDoc(collection(dbVerification, 'unverified-requests'), {
        studentID: studentID,
        status: 'unverified',
        uploadedAt: new Date(),
        storagePath: `unverified-ids/${studentID}.jpg`
    });
    Swal.fire('Submitted', 'Your ID photo has been uploaded. Please wait for admin verification.', 'success');
}

// Capture ID with Camera
function captureImageWithCamera(studentID) {
    Swal.fire({
        title: 'Capture ID with Camera',
        html: '<video id="video" width="100%" autoplay></video><canvas id="canvas" style="display: none;"></canvas>',
        showCancelButton: true,
        confirmButtonText: 'Capture',
        cancelButtonText: 'Cancel',
        willOpen: async () => {
            const video = document.getElementById('video');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                video.srcObject = stream;
            } catch (error) {
                console.error("Camera access error:", error);
                Swal.fire('Error', 'Unable to access camera. Please check permissions.', 'error');
            }
        },
        preConfirm: () => {
            return new Promise((resolve) => {
                const video = document.getElementById('video');
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg');
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const file = result.value;
            uploadIDImage(file, studentID);
        } else {
            const video = document.getElementById('video');
            const stream = video.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach((track) => track.stop());
        }
    });
}

// Validate student ID format (xxx-xxxx-xxxxxx)
function isValidStudentIdFormat(studentID) {
    const idPattern = /^\d{3}-\d{4}-\d{6}$/;
    return idPattern.test(studentID);
}

// Wait for the DOM to be fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    const studentIdInput = document.getElementById('representative-id');

    if (!studentIdInput) {
        console.error('Student ID input not found');
        return;
    }

    studentIdInput.addEventListener('input', function(event) {
        const studentID = event.target.value;
        if (isValidStudentIdFormat(studentID)) {
            debounceVerifyStudentId(studentID);  // Call debounced verification function
        } else {
            displayStatus('Invalid format. Use xxx-xxxx-xxxxxx.', 'red');
        }
    });
});
export { verifyStudentId, isValidStudentIdFormat };
