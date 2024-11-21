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
        displayStatus('Student ID not found. Please verify your ID.', 'red');
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
// id verication required
async function requestIDUpload(studentID) {
    const studentRef = collection(dbVerification, 'unverified-requests');
    const q = query(studentRef, where("studentID", "==", studentID));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Trigger Swal if no request exists in 'unverified-requests'
        const promptUpload = async () => {
            Swal.fire({
                title: 'ID Verification Required',
                text: 'Please upload a photo of your student ID for verification.',
                icon: 'info',
                input: 'file',
                inputAttributes: { accept: 'image/*' },
                showCancelButton: true,
                confirmButtonText: 'Upload File',
                cancelButtonText: 'Use Camera',
                allowOutsideClick: false, // Prevent popup closure by clicking outside
                allowEscapeKey: false,   // Prevent popup closure with Escape key
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const file = result.value;
                    if (file) {
                        await uploadIDImage(file, studentID);
                    } else {
                        // Show a warning if no file is selected
                        Swal.fire({
                            title: 'No File Selected',
                            text: 'You must select a file to continue with the verification.',
                            icon: 'warning',
                        }).then(() => {
                            promptUpload(); // Re-trigger the upload prompt
                        });
                    }
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    captureImageWithCamera(studentID);
                }
            });
        };

        // Initial upload prompt
        promptUpload();
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

// Capture image with camera
function captureImageWithCamera(studentID) {
    let currentStream;
    let facingMode = 'environment'; // Default to back camera

    // Function to stop the current video stream
    function stopStream() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
    }

    // Function to start the camera with the provided facing mode
    async function startCamera(facingMode) {
        stopStream(); // Stop any previous stream before starting a new one

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode }
            });

            currentStream = stream;
            const video = document.getElementById('video');
            video.srcObject = stream;

            // Apply flip to the front camera stream (when 'user' mode is selected)
            if (facingMode === 'user') {
                video.style.transform = 'scaleX(-1)'; // Flip horizontally
            } else {
                video.style.transform = 'none'; // No transformation for back camera
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: 'Unable to access the camera. Please make sure camera permissions are granted.',
                icon: 'error'
            });
        }
    }

    Swal.fire({
        title: 'Capture ID with Camera',
        html: `
            <video id="video" width="100%" autoplay></video>
            <canvas id="canvas" style="display: none;"></canvas>
            <button id="flip-button" style="position: absolute; top: 10px; right: 10px; padding: 10px; background-color: rgba(0, 0, 0, 0.5); color: white; border: none; border-radius: 5px;">Flip Camera</button>
        `,
        showCancelButton: true,
        confirmButtonText: 'Capture',
        cancelButtonText: 'Cancel',
        willOpen: async () => {
            const flipButton = document.getElementById('flip-button');

            // Start with the back camera by default
            await startCamera(facingMode);

            flipButton.addEventListener('click', async () => {
                // Toggle between 'user' (front) and 'environment' (back)
                facingMode = facingMode === 'environment' ? 'user' : 'environment';
                await startCamera(facingMode);
            });
        },
        willClose: () => {
            stopStream(); // Stop camera when the popup closes
        },
        preConfirm: () => {
            return new Promise((resolve) => {
                const video = document.getElementById('video');
                const canvas = document.getElementById('canvas');
                const context = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // If the front camera is used, flip the captured image horizontally
                if (facingMode === 'user') {
                    context.save(); // Save the current state
                    context.scale(-1, 1); // Flip horizontally
                    context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height); // Draw flipped image
                    context.restore(); // Restore to original state
                } else {
                    context.drawImage(video, 0, 0, canvas.width, canvas.height); // Normal drawing for back camera
                }

                // Convert canvas to Blob for further processing
                canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg');
            });
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const file = result.value;
            const img = new Image();
            const reader = new FileReader();

            reader.onload = function (e) {
                img.src = e.target.result;
                img.onload = function () {
                    Swal.fire({
                        title: 'Captured Image',
                        html: `<img src="${e.target.result}" style="width: 100%; height: auto;">`,
                        showCancelButton: true,
                        confirmButtonText: 'Upload',
                        cancelButtonText: 'Retake'
                    }).then((uploadResult) => {
                        if (uploadResult.isConfirmed) {
                            uploadIDImage(file, studentID);
                        } else {
                            captureImageWithCamera(studentID);
                        }
                    });
                };
            };
            reader.readAsDataURL(file);
        } else if (result.isDismissed) {
            Swal.fire({
                title: 'Reminder',
                text: 'Please re-enter the Student ID to reopen the verification process.',
                icon: 'info'
            }).then(() => {
                document.getElementById('representative-id').value = '';
            });
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
