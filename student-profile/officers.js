// Firebase Imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

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
const storage = getStorage(app);
const auth = getAuth();

// Initialize Temporary Profiles from LocalStorage
let tempProfiles = JSON.parse(localStorage.getItem('tempProfiles')) || [];

// Authentication State Listener
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// Load Profiles on Page Load
window.addEventListener('load', () => {
    tempProfiles = JSON.parse(localStorage.getItem('tempProfiles')) || [];
    updateTable(tempProfiles);
});

// Show the loading spinner
function showLoading() {
    document.getElementById("loading").style.display = "flex";
}

// Hide the loading spinner
function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Event Listeners
document.getElementById('img').addEventListener('change', handleImageUpload);
document.querySelector('.add-btn').addEventListener('click', addProfile);
document.querySelector('.submit-btn button').addEventListener('click', submitAllProfiles);
document.getElementById('search-input').addEventListener('input', searchProfiles);
document.getElementById('student-id').addEventListener('input', formatStudentId);
document.getElementById('clear-profiles').addEventListener('click', clearProfiles);
document.querySelector('.update-btn').addEventListener('click', updateProfile);
document.getElementById('add-position-btn').addEventListener('click', addPosition);
// Format Student ID Input
function formatStudentId(event) {
    let input = event.target.value.replace(/\D/g, '');
    if (input.length > 3) input = input.substring(0, 3) + '-' + input.substring(3);
    if (input.length > 8) input = input.substring(0, 8) + '-' + input.substring(8);
    event.target.value = input;
}

// Handle Image Upload and Preview
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
    } else {
        preview.style.display = 'none';
        uploadText.style.display = 'block';
    }
}

// Upload Image to Firebase Storage
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

// Add a New Profile with SweetAlert Integration
async function addProfile() {
    const addButton = document.querySelector('.add-btn');
    
    // Disable the button to prevent double clicks
    addButton.disabled = true;

    const studentId = document.getElementById('student-id').value.trim();
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const file = document.getElementById('img').files[0];
    const position = document.getElementById('position').value;
    // Validate Inputs
     if (!studentId || !name || !address || !file || !position) {
        Swal.fire("Incomplete Input", "Please fill in all fields, including the image upload and position.", "warning");
        addButton.disabled = false; // Re-enable the button
        return;
    }
    // Validate Student ID Format
    const idFormat = /^\d{3}-\d{4}-\d{6}$/; // Adjust this pattern based on your ID format
    if (!idFormat.test(studentId)) {
        Swal.fire("Invalid ID Format", "Please use the format XXX-XXXX-XXXXXX.", "warning");
        addButton.disabled = false; // Re-enable the button
        return;
    }

    // Check for Duplicate Student ID in Temporary Profiles
    if (tempProfiles.some(profile => profile.studentId === studentId)) {
        Swal.fire("Duplicate ID", "A profile with this Student ID already exists in the temporary table.", "warning");
        addButton.disabled = false; // Re-enable the button
        return;
    }

    // Check for Duplicate Student ID in Firestore
    const profilesRef = collection(db, "student-org-applications");
    const q = query(profilesRef, where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        Swal.fire("Duplicate ID", "A profile with this Student ID already exists.", "warning");
        addButton.disabled = false; // Re-enable the button
        return;
    }

    // Show Swal Loading Alert
    Swal.fire({
        title: "Adding Profile",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Upload Image to Firebase
    const imageUrl = await uploadImage(file);
    if (!imageUrl) {
        Swal.close(); // Close loading alert
        Swal.fire("Upload Failed", "Failed to upload image. Please try again.", "error");
        addButton.disabled = false; // Re-enable the button
        return;
    }

      // Create New Profile Object
      const newProfile = { studentId, name, address, imageUrl, position };
      tempProfiles.push(newProfile);
      localStorage.setItem('tempProfiles', JSON.stringify(tempProfiles));
      updateTable(tempProfiles);

    // Close Loading Alert and Show Success Message
    Swal.close();
    Swal.fire("Success", "Profile added successfully!", "success");

    // Clear form inputs
    clearStudentProfileForm();

    // Re-enable the button after successful submission
    addButton.disabled = false;
}
async function updateProfile() {
    const studentId = document.getElementById('student-id').value.trim();
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    const imageUrl = document.getElementById('image-preview').src;
    const position = document.getElementById('position').value.trim();

    // Validate Inputs
    if (!studentId || !name || !address || !position) {
        Swal.fire("Incomplete Input", "Please fill in all fields.", "warning");
        return;
    }

    // Validate Student ID Format
    const idFormat = /^\d{3}-\d{4}-\d{6}$/; 
    if (!idFormat.test(studentId)) {
        Swal.fire("Invalid ID Format", "Please use the format XXX-XXXX-XXXXXX.", "warning");
        return;
    }

    // Find the Profile to Update
    const index = tempProfiles.findIndex(profile => profile.studentId.trim() === studentId);

    if (index === -1) {
        Swal.fire("Profile Not Found", "No profile found with the provided Student ID.", "error");
        return;
    }

    // Show Swal Loading Alert
    Swal.fire({
        title: "Updating Profile",
        text: "Please wait...",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Update Profile Details
    tempProfiles[index].studentId = studentId;
    tempProfiles[index].name = name;
    tempProfiles[index].address = address;
    tempProfiles[index].imageUrl = imageUrl;
    tempProfiles[index].position = position;

    // Update LocalStorage and Refresh Table
    localStorage.setItem('tempProfiles', JSON.stringify(tempProfiles));
    updateTable(tempProfiles);

    // Close Loading Alert and Show Success Message (Shortened Delay)
    setTimeout(() => {
        Swal.close();
        Swal.fire("Success", "Profile updated successfully!", "success");
    }, 500); 

    clearStudentProfileForm();
}
// Clear All Profiles with Confirmation
function clearProfiles() {
    Swal.fire({
        title: "Are you sure?",
        text: "Are you sure you want to clear all added profiles?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, clear them!",
        cancelButtonText: "Cancel"
    }).then((result) => {
        if (result.isConfirmed) {
            tempProfiles = []; // Clear the temporary profiles array
            localStorage.removeItem('tempProfiles'); // Clear localStorage
            updateTable(tempProfiles); // Refresh the table
            Swal.fire("Cleared!", "All profiles have been cleared.", "success");
        }
    });
}
// Add or Change Position to the Selected Profile (Including Adding New Position)
function addPosition() {
    const positionDropdown = document.getElementById('position');
    const selectedPosition = positionDropdown.value;

    // If no position is selected, show SweetAlert to either select a position or add a new one
    if (!selectedPosition) {
        Swal.fire({
            title: 'No Position Selected',
            text: 'Please select a position or add a new one.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Add New Position',
            cancelButtonText: 'Select Existing Position'
        }).then((result) => {
            if (result.isConfirmed) {
                // Prompt the user to enter a new position
                Swal.fire({
                    title: 'Add New Position',
                    input: 'text',
                    inputPlaceholder: 'Enter the new position name',
                    showCancelButton: true,
                    confirmButtonText: 'Add Position',
                    cancelButtonText: 'Cancel',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'You need to enter a position name!';
                        }
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        const newPosition = result.value.trim();

                        if (newPosition) {
                            // Add the new position to the dropdown
                            const newOption = document.createElement('option');
                            newOption.value = newPosition;
                            newOption.textContent = newPosition;

                            // Append the new position to the dropdown
                            positionDropdown.appendChild(newOption);

                            // Set the new position as the selected value in the dropdown
                            positionDropdown.value = newPosition;

                            // Show confirmation message for the new position
                            Swal.fire('New Position Added', `The position "${newPosition}" has been added to the list.`, 'info');
                        }
                    }
                });
            } else {
                // If they want to select an existing position, show a message to select it
                Swal.fire('No Position Selected', 'Please select a position before adding.', 'warning');
            }
        });
        return;
    }

    // If a position is already selected, allow the user to change it by adding a new position manually
    Swal.fire({
        title: 'Change Position',
        text: `You have selected the position "${selectedPosition}". Do you want to change it?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Change Position',
        cancelButtonText: 'Keep Current Position'
    }).then((result) => {
        if (result.isConfirmed) {
            // Prompt the user to enter a new position manually
            Swal.fire({
                title: 'Enter New Position',
                input: 'text',
                inputPlaceholder: 'Enter the new position name',
                showCancelButton: true,
                confirmButtonText: 'Change Position',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Please enter a valid position name!';
                    }
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const newPosition = result.value.trim();

                    // If the user enters a new position, update the dropdown and display confirmation
                    if (newPosition) {
                        // Update the dropdown with the new position
                        // First, clear the selected position in the dropdown (if needed)
                        const newOption = document.createElement('option');
                        newOption.value = newPosition;
                        newOption.textContent = newPosition;

                        // Add the new position to the dropdown
                        positionDropdown.appendChild(newOption);

                        // Select the newly added position in the dropdown
                        positionDropdown.value = newPosition;

                        // Show confirmation message for the new position
                        Swal.fire('Position Changed', `The position has been changed to "${newPosition}".`, 'success');
                    }
                }
            });
        } else {
            // If the user wants to keep the selected position, show confirmation
            Swal.fire('Position Kept', `You have kept the position "${selectedPosition}".`, 'info');
        }
    });
}
// Update the profiles table
function updateTable(profiles) {
    const profilesListBody = document.getElementById('profiles-list-body');
    profilesListBody.innerHTML = ''; // Clear existing profiles

    profiles.forEach((profile, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${profile.imageUrl}" alt="Profile Image" width="50" height="50"></td>
            <td>${profile.studentId}</td>
            <td>${profile.name}</td>
            <td>${profile.address}</td>
            <td>${profile.position}</td>
            <td><button class="delete-btn" data-index="${index}"><i class='bx bx-trash'></i> Delete</button></td
        `;
        profilesListBody.appendChild(row);
    });

    // Add event listeners for the delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteProfile);
    });
}

// Delete a profile from the list
function deleteProfile(event) {
    const index = event.target.closest('button').getAttribute('data-index');

    Swal.fire({
        title: "Are you sure?",
        text: "This will permanently delete the profile!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel"
    }).then((result) => {
        if (result.isConfirmed) {
            tempProfiles.splice(index, 1); // Remove profile from tempProfiles array
            localStorage.setItem('tempProfiles', JSON.stringify(tempProfiles)); // Update localStorage
            updateTable(tempProfiles); // Refresh the displayed list
            Swal.fire("Deleted!", "Profile has been deleted.", "success");
        }
    });
}
// Search Profiles Based on Input
async function searchProfiles() {
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    const dropdown = document.getElementById('dropdown-list');
    dropdown.innerHTML = ''; // Clear previous results

    if (searchValue.length === 0) {
        dropdown.style.display = 'none'; // Hide dropdown if search input is empty
        return;
    }

    // Filter through tempProfiles to find matches by name
    const filteredProfiles = tempProfiles.filter(profile =>
        profile.name.toLowerCase().includes(searchValue)
    );

    if (filteredProfiles.length > 0) {
        dropdown.style.display = 'block'; // Show dropdown if matches are found
        filteredProfiles.forEach(profile => {
            const option = document.createElement('div');
            option.classList.add('dropdown-item');
            option.textContent = profile.name; // Show name in the dropdown
            option.onclick = () => selectProfile(profile); // Pass the selected profile
            dropdown.appendChild(option);
        });
    } else {
        dropdown.style.display = 'none'; // Hide if no matches are found
    }
}

// Handle Profile Selection from Dropdown
function selectProfile(profile) {
    clearStudentProfileForm(); // Clear the form first

    // Populate form with selected profile details
    document.getElementById('student-id').value = profile.studentId;
    document.getElementById('name').value = profile.name;
    document.getElementById('address').value = profile.address;

    const preview = document.getElementById('image-preview');
    const uploadText = document.getElementById('upload-text');

    if (profile.imageUrl) {
        preview.src = profile.imageUrl;
        preview.style.display = 'block';
        uploadText.style.display = 'none';
    } else {
        preview.style.display = 'none';
        uploadText.style.display = 'block';
    }

    // Hide the dropdown and clear search input
    document.getElementById('search-input').value = ''; // Clear search input
    document.getElementById('dropdown-list').style.display = 'none'; // Hide dropdown
}

// Clear the Student Profile Form
function clearStudentProfileForm() {
    document.getElementById('student-id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('img').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('upload-text').style.display = 'block';
    document.getElementById('position').value ='';
}

// Function to Get Current Time in 'HH:MM AM/PM' Format
function getCurrentTime() {
    const now = new Date();
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    return now.toLocaleString('en-US', options);
}

let submitting = false; // Flag to track if submission is in progress

// Submit All Profiles to Firestore
async function submitAllProfiles() {
    // Prevent duplicate submissions
    if (submitting) return;
    submitting = true;

    if (tempProfiles.length === 0) {
        Swal.fire("No Profiles", "There are no profiles to submit.", "info");
        submitting = false; // Reset the flag
        return;
    }

    try {
        showLoading();

        const user = auth.currentUser;
        if (!user) {
            Swal.fire("Authentication Error", "User is not authenticated.", "error");
            hideLoading();
            submitting = false; // Reset the flag
            return;
        }

        // Load application data from localStorage for the authenticated user
        const applicationData = JSON.parse(localStorage.getItem(`applicationFormData_${user.uid}`)) || {};

        // Get the current time
        const currentTime = getCurrentTime();
        

        // Combine application data and profiles
        const combinedData = {
            applicationDetails: applicationData,  // Data from the application form
            profiles: tempProfiles,               // Temp profiles stored locally
            submissionTime: currentTime           // Add the current time to the combined data
        };

        // Reference to Firestore collection
        const profilesRef = collection(db, "student-org-applications");

        // Add the combined data as one document in Firestore
        await addDoc(profilesRef, combinedData);
        console.log("All profiles and application data saved in one document.");

        // Clear temporary profiles and localStorage after successful submission
        tempProfiles = [];
        localStorage.removeItem('tempProfiles');
        localStorage.removeItem(`applicationFormData_${user.uid}`);
        updateTable(tempProfiles); // Update the table after clearing profiles

        // Show success message with longer display time
        Swal.fire({
            title: "Submitted!",
            text: "All profiles and application data submitted successfully! Please check your email.",
            icon: "success",
            timer: 5000, // Keep the alert open for 5 seconds
            timerProgressBar: true,
            showCloseButton: true // Allow user to close the alert manually
        }).then(() => {
            window.location.href = "../index.html"; // Redirect after submission
        });
        
    } catch (error) {
        console.error("Error submitting profiles and application data: ", error);
        Swal.fire("Submission Error", "Error submitting profiles and application data. Please try again.", "error");
    } finally {
        hideLoading();
        submitting = false; // Reset the flag
    }
}