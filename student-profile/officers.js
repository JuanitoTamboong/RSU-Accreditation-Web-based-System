// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

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
const storage = getStorage(app);
const db = getFirestore(app);

// Event listeners for profile-related buttons
document.getElementById('img').addEventListener('change', handleImageUpload);
document.querySelector('.update-btn').addEventListener('click', updateProfile);
document.querySelector('.add-btn').addEventListener('click', addProfile);
document.querySelector('.submit-btn button').addEventListener('click', submitAllProfiles);

// Search input event listener
document.getElementById('search-input').addEventListener('input', searchProfiles);

// Handle image upload and preview
async function handleImageUpload(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    const uploadText = document.getElementById('upload-text');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            uploadText.style.display = 'none'; // Hide 'Upload Image' text
        };
        reader.readAsDataURL(file);

        try {
            return await uploadImage(file);
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload image.');
            return null;
        }
    } else {
        preview.style.display = 'none';
        uploadText.style.display = 'block';
        return null;
    }
}

// Upload image to Firebase Storage
async function uploadImage(file) {
    const storageRef = ref(storage, `images/${file.name}`);
    try {
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading image: ", error);
        return null;
    }
}

// Add a new profile to Firestore
async function addProfile() {
    const studentId = document.getElementById('student-id').value;
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const file = document.getElementById('img').files[0];

    if (!studentId || !name || !address) {
        alert("Please fill in all fields.");
        return;
    }

    let imageUrl = null;
    if (file) {
        imageUrl = await handleImageUpload({ target: { files: [file] } });
    }

    try {
        // Add profile to Firestore
        await addDoc(collection(db, "profiles"), {
            studentId,
            name,
            address,
            imageUrl
        });
        alert("Profile added successfully!");
        addProfileToTable(studentId, name, address, imageUrl);
    } catch (error) {
        console.error("Error adding profile: ", error);
        alert("Failed to add profile.");
    }
}

// Add profile details to the table
function addProfileToTable(studentId, name, address, imageUrl) {
    const table = document.getElementById('profiles-list');
    const row = table.insertRow();
    row.insertCell().innerHTML = imageUrl ? `<img src="${imageUrl}" alt="Profile Image" style="width: 50px; height: 50px; object-fit: cover;">` : 'No Image';
    row.insertCell().innerText = studentId;
    row.insertCell().innerText = name;
    row.insertCell().innerText = address;
}
// Search for profiles by name in Firestore
async function searchProfiles() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
    
    // Reference to the 'profiles' collection in Firestore
    const profilesRef = collection(db, "profiles");
    
    // Get all profiles from Firestore
    const querySnapshot = await getDocs(profilesRef);

    let profileFound = false;

    // Filter and display matching profiles that start with the search query
    querySnapshot.forEach((doc) => {
        const profile = doc.data();
        const profileName = profile.name.toLowerCase();
        
        // Check if the profile name starts with the search query
        if (profileName.startsWith(searchQuery)) {
            profileFound = true;
            displayProfileInForm(profile.studentId, profile.name, profile.address, profile.imageUrl);
        }
    });

    if (!profileFound) {
        clearProfileForm();
    }
}

// Function to display profile data in the form fields
function displayProfileInForm(studentId, name, address, imageUrl) {
    // Populate the form fields with the profile data
    document.getElementById('student-id').value = studentId;
    document.getElementById('name').value = name;
    document.getElementById('address').value = address;

    // If an image URL exists, display it in the image preview
    if (imageUrl) {
        const imagePreview = document.getElementById('image-preview');
        const uploadText = document.getElementById('upload-text');
        imagePreview.src = imageUrl;
        imagePreview.style.display = 'block'; // Show image
        uploadText.style.display = 'none'; // Hide upload text
    }
}

// Function to clear the form fields if no profile is found
function clearProfileForm() {
    document.getElementById('student-id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('upload-text').style.display = 'block';
}


// Placeholder for update profile functionality
async function updateProfile() {
    alert("Update feature not yet implemented.");
}

// Placeholder for submit all profiles functionality
async function submitAllProfiles() {
    alert("Profiles submitted successfully!");
}
