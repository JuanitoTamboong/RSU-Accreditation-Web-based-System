// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

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
const auth = getAuth();

// Authentication state listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// Function to show the loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

// Function to hide the loading spinner
function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Event listeners for profile-related buttons
document.getElementById('img').addEventListener('change', handleImageUpload);
document.querySelector('.update-btn').addEventListener('click', updateProfile);
document.querySelector('.add-btn').addEventListener('click', addProfile);
document.querySelector('.submit-btn button').addEventListener('click', submitAllProfiles);
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
            uploadText.style.display = 'none';
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

    // Check for duplicate Student IDs
    const profilesRef = collection(db, "profiles");
    const q = query(profilesRef, where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        alert("A profile with this Student ID already exists.");
        return;
    }

    let imageUrl = null;
    if (file) {
        imageUrl = await handleImageUpload({ target: { files: [file] } });
    }

    try {
        // Add profile to Firestore
        showLoading();
        await addDoc(collection(db, "profiles"), {
            studentId,
            name,
            address,
            imageUrl
        });
        alert("Profile added successfully!");
        addProfileToTable(studentId, name, address, imageUrl);
        updateDatalist();
    } catch (error) {
        console.error("Error adding profile: ", error);
        alert("Failed to add profile.");
    }
    hideLoading();
}

// Add profile details to the table
function addProfileToTable(studentId, name, address, imageUrl) {
    const table = document.getElementById('profiles-list-body');
    const row = table.insertRow();
    row.insertCell().innerHTML = imageUrl ? `<img src="${imageUrl}" alt="Profile Image" style="width: 50px; height: 50px; object-fit: cover;">` : 'No Image';
    row.insertCell().innerText = studentId;
    row.insertCell().innerText = name;
    row.insertCell().innerText = address;
}

// Update the datalist with profile names
async function updateDatalist() {
    const datalist = document.getElementById('profiles-list');
    datalist.innerHTML = ''; // Clear existing options

    const profilesRef = collection(db, "profiles");
    const querySnapshot = await getDocs(profilesRef);

    querySnapshot.forEach((doc) => {
        const { name } = doc.data();
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
}

// Search profiles based on input
async function searchProfiles() {
    const queryText = document.getElementById('search-input').value.toLowerCase();
    const profilesRef = collection(db, "profiles");
    const querySnapshot = await getDocs(profilesRef);

    const matches = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name.toLowerCase().includes(queryText)) {
            matches.push(data);
        }
    });

    displaySearchResults(matches);
}

// Display search results in the table
function displaySearchResults(profiles) {
    const table = document.getElementById('profiles-list-body');
    table.innerHTML = ''; // Clear existing rows

    profiles.forEach(profile => {
        addProfileToTable(profile.studentId, profile.name, profile.address, profile.imageUrl);
    });
}

// Submit all profiles
async function submitAllProfiles() {
    showLoading(); // Show the spinner before starting
    try {
        const profilesRef = collection(db, "profiles");
        const querySnapshot = await getDocs(profilesRef);

        const profiles = [];
        querySnapshot.forEach((doc) => {
            profiles.push(doc.data());
        });

        // Log or process the profiles data (this could be sending data to an API, etc.)
        console.log("Submitting profiles:", profiles);

        alert("All profiles have been submitted successfully!");
    } catch (error) {
        console.error("Error submitting profiles: ", error);
        alert("Failed to submit profiles.");
    } finally {
        hideLoading(); // Hide the spinner after the operation is done
    }
}

// Update profile function (placeholder for implementation)
async function updateProfile() {
    alert('Update profile functionality is not yet implemented.');
}
