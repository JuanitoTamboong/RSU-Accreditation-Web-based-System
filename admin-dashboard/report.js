// Import necessary functions from Firebase SDK
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Global variables to hold the chart instances
let totalApplicationsChart = null;
let totalAccreditedChart = null; 
let totalReAccreditedChart = null; 
let totalRejectedChart = null; 
let applicantsOverTimeChart = null; 

async function fetchAllApplicationData(schoolYear) {
    try {
        // Validate schoolYear input
        if (!schoolYear || typeof schoolYear !== 'string') {
            console.error("School year is undefined or not a string:", schoolYear);
            Swal.fire({
                icon: 'error',
                title: 'Invalid Input',
                text: 'Please provide a valid school year.',
            });
            return; // Exit the function if schoolYear is invalid
        }

        const applicationsCollection = collection(db, 'student-org-applications');
        const snapshot = await getDocs(applicationsCollection);
        
        const applications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Log all fetched applications
        console.log("Total Applications Fetched:", applications.length); 
        console.log("Fetched Applications Data:", applications); // Log fetched applications data

        // Filter applications by the provided schoolYear
        const filteredApplications = applications.filter(app => {
            const appSchoolYear = app.applicationDetails?.schoolYear || ''; // Get schoolYear from applicationDetails
            console.log("Checking application school year:", appSchoolYear); // Log each school's year being checked
            return appSchoolYear === schoolYear.trim(); // Compare with input schoolYear
        });

        // Log the filtered applications
        console.log("Filtered Applications:", filteredApplications); // Log filtered applications

        // Process the applications data to calculate totals
        const totalApplications = {
            accredited: 0,
            reaccredited: 0,
            rejected: 0,
            total: filteredApplications.length
        };

        filteredApplications.forEach(applicationDetails => {
            const status = applicationDetails.applicationStatus ? applicationDetails.applicationStatus.toLowerCase().trim() : '';
            console.log("Application Status:", status); // Log application status
            if (status === "approved") {
                totalApplications.accredited += 1;
            } else if (status === "re-accredited") {
                totalApplications.reaccredited += 1;
            } else if (status === "rejected") {
                totalApplications.rejected += 1;
            }
        });

        console.log("Total Applications Data:", totalApplications); // Log total application data

        // Create charts if data exists
        if (totalApplications.total > 0) {
            createTotalApplicationsChart(totalApplications);
            createTotalAccreditedChart(totalApplications);
            createTotalReAccreditedChart(totalApplications);
            createTotalRejectedChart(totalApplications);
            createApplicantsOverTimeByOrganizationChart(filteredApplications, schoolYear); // Update the function call
        } else {
            console.warn("No applications found for the selected school year.");
            // Display a message to the user if no applications were found
            Swal.fire({
                icon: 'info',
                title: 'No Applications Found',
                text: 'There are no applications for the selected school year.',
            });
        }
    } catch (error) {
        console.error("Error fetching report data:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to fetch report data. Please try again later.',
        });
    }
}

// Form submission event listener
document.getElementById('applicationReportForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const schoolYearInput = document.getElementById('school-year').value.trim();
    
    console.log("School Year Input:", schoolYearInput); // Debugging log

    // Format the school year input (e.g., 2024-2025)
    if (!schoolYearInput) {
        console.error("School year input is empty.");
        Swal.fire({
            icon: 'error',
            title: 'Invalid Input',
            text: 'Please provide a school year.',
        });
        return; // Exit if input is empty
    }

    // Format to automatically add dash if needed
    const formattedSchoolYear = formatSchoolYear(schoolYearInput);
    fetchAllApplicationData(formattedSchoolYear);
});

// Function to format the school year input
function formatSchoolYear(input) {
    const parts = input.split('-');
    if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 4) {
        return `${parts[0]}-${parts[1]}`; // Return formatted as is
    } else if (parts.length === 1 && parts[0].length === 4) {
        const nextYear = parseInt(parts[0], 10) + 1;
        return `${parts[0]}-${nextYear}`; // Automatically create the next year
    } else {
        console.error("Invalid school year format. Expected format: YYYY-YYYY");
        Swal.fire({
            icon: 'error',
            title: 'Invalid Format',
            text: 'Please enter the school year in the format YYYY-YYYY.',
        });
        return ''; // Return empty string if format is incorrect
    }
}// Function to create or update the total applications chart
function createTotalApplicationsChart(totalApplications) {
    const ctx = document.getElementById('totalApplicationsChart').getContext('2d');
    if (totalApplicationsChart instanceof Chart) {
        totalApplicationsChart.destroy(); // Destroy previous chart instance
    }
    totalApplicationsChart = new Chart(ctx, {
        type: 'line', // Change to line chart
        data: {
            labels: ['Total Applications'],
            datasets: [{
                label: 'Total Applications Overview',
                data: [totalApplications.total],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                pointRadius: 5, // Show points on the line
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                fill: false, // Disable area fill under the line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Applications Report' }
            },
            scales: {
                y: {
                    beginAtZero: true // Ensure the Y-axis starts at zero
                }
            }
        }
    });
}

// Function to create or update the total accredited applications chart
function createTotalAccreditedChart(totalApplications) {
    const ctx = document.getElementById('totalAccreditedChart').getContext('2d');
    if (totalAccreditedChart instanceof Chart) {
        totalAccreditedChart.destroy(); // Destroy previous chart instance
    }

    totalAccreditedChart = new Chart(ctx, {
        type: 'line', // Change to line chart
        data: {
            labels: ['Accredited Applications'],
            datasets: [{
                label: 'Total Accredited',
                data: [totalApplications.accredited],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                pointRadius: 5, // Show points on the line
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                fill: false, // Disable area fill under the line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Accredited Applications' }
            },
            scales: {
                y: {
                    beginAtZero: true // Ensure the Y-axis starts at zero
                }
            }
        }
    });
}

// Function to create or update the total reaccredited applications chart
function createTotalReAccreditedChart(totalApplications) {
    const ctx = document.getElementById('totalReAccreditedChart').getContext('2d');
    if (totalReAccreditedChart instanceof Chart) {
        totalReAccreditedChart.destroy(); // Destroy previous chart instance
    }

    totalReAccreditedChart = new Chart(ctx, {
        type: 'line', // Change to line chart
        data: {
            labels: ['Re-accredited Applications'],
            datasets: [{
                label: 'Total Re-accredited',
                data: [totalApplications.reaccredited],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 2,
                pointRadius: 5, // Show points on the line
                pointBackgroundColor: 'rgba(153, 102, 255, 1)',
                fill: false, // Disable area fill under the line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Re-accredited Applications' }
            },
            scales: {
                y: {
                    beginAtZero: true // Ensure the Y-axis starts at zero
                }
            }
        }
    });
}

// Function to create or update the total rejected applications chart
function createTotalRejectedChart(totalApplications) {
    const ctx = document.getElementById('totalRejectedChart').getContext('2d');
    if (totalRejectedChart instanceof Chart) {
        totalRejectedChart.destroy(); // Destroy previous chart instance
    }

    totalRejectedChart = new Chart(ctx, {
        type: 'line', // Change to line chart
        data: {
            labels: ['Rejected Applications'],
            datasets: [{
                label: 'Total Rejected',
                data: [totalApplications.rejected],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                pointRadius: 5, // Show points on the line
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                fill: false, // Disable area fill under the line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Rejected Applications' }
            },
            scales: {
                y: {
                    beginAtZero: true // Ensure the Y-axis starts at zero
                }
            }
        }
    });
}

// Function to create applicants over time by organization pie chart with all statuses
function createApplicantsOverTimeByOrganizationChart(filteredApplications, schoolYear) {
    const ctx = document.getElementById('applicantsOverTimeByOrganizationChart').getContext('2d');

    // Group applications by organization and status
    const organizationData = filteredApplications.reduce((acc, application) => {
        const organization = application.applicationDetails.organizationName || 'Unknown Organization'; // Default value
        const status = application.applicationStatus ? application.applicationStatus.toLowerCase().trim() : 'unknown'; // Default value

        // Create a unique key for each organization-status combination
        const key = `${organization} (${status})`; // Create unique key

        // Increment the count for this key
        if (!acc[key]) {
            acc[key] = 0;
        }
        acc[key] += 1; // Count applications for each organization and status
        return acc;
    }, {});

    // Prepare data for the pie chart
    const labels = Object.keys(organizationData);
    const data = Object.values(organizationData);

    // Define colors for the pie chart
    const backgroundColors = [
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
    ];

    if (applicantsOverTimeChart instanceof Chart) {
        applicantsOverTimeChart.destroy(); // Destroy previous chart instance
    }

    applicantsOverTimeChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'], // Ensure there's a label
            datasets: [{
                label: `Applications by Organization - SY ${schoolYear}`,
                data: data.length > 0 ? data : [1], // Provide a default data value if empty
                backgroundColor: backgroundColors.slice(0, labels.length), // Limit colors to the number of labels
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: `Applicants Over Time by Organization - SY ${schoolYear}` }
            }
        }
    });
}


// Function to generate PDF with chart images and data table
function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title to the report
    doc.setFontSize(18);
    doc.text("Applications Report", 14, 22);

    // Define a medium size for images
    const imageWidth = 70; // Set desired width
    const imageHeight = 70; // Set desired height

    // Capture the pie chart as an image and add it to the PDF
    if (applicantsOverTimeChart) {
        const applicantsChartImage = applicantsOverTimeChart.toBase64Image(); // Convert pie chart to base64 image
        doc.addImage(applicantsChartImage, 'PNG', 10, 40, imageWidth, imageHeight); // Add pie chart image
    }

    // Add other charts (optional) - if you have them already
    if (totalApplicationsChart) {
        const totalApplicationsImage = totalApplicationsChart.toBase64Image(); 
        doc.addImage(totalApplicationsImage, 'PNG', 10, 130, imageWidth, imageHeight); 
    }

    if (totalAccreditedChart) {
        const totalAccreditedImage = totalAccreditedChart.toBase64Image();
        doc.addImage(totalAccreditedImage, 'PNG', 10, 220, imageWidth, imageHeight); 
    }

    // Add applicants over time by organization chart (pie chart) image
    if (applicantsOverTimeChart) {
        const applicantsOverTimeImage = applicantsOverTimeChart.toBase64Image();
        doc.addImage(applicantsOverTimeImage, 'PNG', 10, 310, imageWidth, imageHeight); // Position below other charts
    }

    // Add data table title
    doc.setFontSize(12);
    doc.text("Data Table", 14, 410);

    // Prepare data to add to the table (including pie chart data)
    const pieChartData = applicantsOverTimeChart?.data.datasets[0].data.map((value, index) => {
        return {
            label: applicantsOverTimeChart.data.labels[index],
            value: value
        };
    }) || [];

    const tableData = [
        { label: 'Total Applications', value: totalApplicationsChart?.data.datasets[0].data[0] || 0 },
        { label: 'Accredited Applications', value: totalAccreditedChart?.data.datasets[0].data[0] || 0 },
        { label: 'Reaccredited Applications', value: totalReAccreditedChart?.data.datasets[0].data[0] || 0 },
        { label: 'Rejected Applications', value: totalRejectedChart?.data.datasets[0].data[0] || 0 }
    ].concat(pieChartData);  // Combine existing table data with pie chart data

    // Add table with jsPDF autoTable plugin
    doc.autoTable({
        head: [['Category', 'Applications']],
        body: tableData.map(item => [item.label, item.value]),
        startY: 420, // Adjust table start position after charts
    });

    // Save the PDF
    doc.save(`Applications_Report_${new Date().toLocaleDateString()}.pdf`);
}

// Attach event listener to download button
document.getElementById('downloadReport').addEventListener('click', function () {
    generatePDFReport();
});
