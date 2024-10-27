import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import { getFirestore, collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';


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

// Define month labels globally
const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

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

        // Listen for real-time updates
        onSnapshot(applicationsCollection, (snapshot) => {
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
                total: filteredApplications.length,
                monthlyData: Array(12).fill(0) // Array to hold monthly data
            };

            filteredApplications.forEach(applicationDetails => {
                // Get the date from the applicationDetails
                const dateFiling = applicationDetails.applicationDetails?.dateFiling; // Ensure you're accessing the correct field

                // Parse the date to create a Date object
                const date = dateFiling ? new Date(dateFiling) : null; // Handle potential null or undefined values

                // Check if date is valid
                if (date && !isNaN(date)) {
                    const month = date.getMonth(); // Get month (0-11)
                    totalApplications.monthlyData[month] += 1; // Increment the count for the corresponding month
                }

                // Count statuses
                const status = applicationDetails.applicationStatus ? applicationDetails.applicationStatus.toLowerCase().trim() : '';
                if (status === "approved") {
                    totalApplications.accredited += 1;
                } else if (status === "Renewal") {
                    totalApplications.reaccredited += 1;
                } else if (status === "rejected") {
                    totalApplications.rejected += 1;
                }
            });

            console.log("Total Applications Data:", totalApplications); // Log total application data

            // Create charts if data exists
            if (totalApplications.total > 0) {
                createTotalApplicationsChart(totalApplications);
                createTotalAccreditedChart(totalApplications, filteredApplications);
                createTotalReAccreditedChart(totalApplications, filteredApplications);
                createTotalRejectedChart(totalApplications, filteredApplications);
                createApplicantsOverTimeByOrganizationChart(filteredApplications, schoolYear);
            } else {
                console.warn("No applications found for the selected school year.");
                // Display a message to the user if no applications were found
                Swal.fire({
                    icon: 'info',
                    title: 'No Applications Found',
                    text: 'There are no applications for the selected school year.',
                    customClass:'swal-pop-up',
                });
            }
        });
    } catch (error) {
        console.error("Error fetching report data:", error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Failed to fetch report data. Please try again later.',
            customClass:'swal-pop-up',
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
            customClass:'swal-pop-up'
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
            customClass:'swal-pop-up',
        });
        return ''; // Return empty string if format is incorrect
    }
}

// Function to create or update the total applications chart
function createTotalApplicationsChart(totalApplications) {
    const ctx = document.getElementById('totalApplicationsChart').getContext('2d');
    if (totalApplicationsChart instanceof Chart) {
        totalApplicationsChart.destroy(); // Destroy previous chart instance
    }

    totalApplicationsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Total Applications by Month',
                data: totalApplications.monthlyData, // Use the monthly data
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                pointStyle: 'circle', // Change this to your desired point style (circle, triangle, etc.)
                pointRadius: 5, // Customize the size of the points
                pointHoverRadius: 7, // Customize the hover size of the points
                fill: true // Set to true if you want to fill under the line
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Applications by Month' }
            },
            elements: {
                point: {
                    radius: 5, // Default point size
                    hoverRadius: 7 // Hover point size
                }
            }
        }
    });
}

// Function to create or update the total accredited applications chart
function createTotalAccreditedChart(totalApplications, filteredApplications) {
    const ctx = document.getElementById('totalAccreditedChart').getContext('2d');
    if (totalAccreditedChart instanceof Chart) {
        totalAccreditedChart.destroy(); // Destroy previous chart instance
    }

    const monthlyAccreditedData = Array(12).fill(0); // Initialize monthly data
    filteredApplications.forEach(applicationDetails => {
        const status = applicationDetails.applicationStatus ? applicationDetails.applicationStatus.toLowerCase().trim() : '';
        if (status === "approved") {
            const dateFiling = applicationDetails.applicationDetails?.dateFiling;
            const date = dateFiling ? new Date(dateFiling) : null;

            // Check if date is valid
            if (date && !isNaN(date)) {
                const month = date.getMonth(); // Get month (0-11)
                monthlyAccreditedData[month] += 1; // Increment the count for the corresponding month
            }
        }
    });

    totalAccreditedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Total Accredited Applications by Month',
                data: monthlyAccreditedData, // Use the accredited monthly data
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Accredited Applications by Month' }
            }
        }
    });
}
// Function to create or update the total reaccredited applications chart
function createTotalReAccreditedChart(totalApplications, filteredApplications) {
    const ctx = document.getElementById('totalReAccreditedChart').getContext('2d');
    if (totalReAccreditedChart instanceof Chart) {
        totalReAccreditedChart.destroy(); // Destroy previous chart instance
    }

    const monthlyReAccreditedData = Array(12).fill(0); 
    filteredApplications.forEach(applicationDetails => {
        const status = applicationDetails.applicationStatus ? applicationDetails.applicationStatus.toLowerCase().trim() : '';
        const accreditationType = applicationDetails.applicationDetails?.typeOfAccreditation ? 
                                  applicationDetails.applicationDetails.typeOfAccreditation.toLowerCase().trim() : '';

        // Check for both approved status and renewal accreditation type
        if (status === "approved" && accreditationType === "renewal") {
            const dateFiling = applicationDetails.applicationDetails?.dateFiling;
            const date = dateFiling ? new Date(dateFiling) : null;

            // Check if date is valid
            if (date && !isNaN(date)) {
                const month = date.getMonth(); 
                monthlyReAccreditedData[month] += 1; 
            }
        }
    });

    totalReAccreditedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Total Reaccredited Applications by Month',
                data: monthlyReAccreditedData,
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Reaccredited Applications by Month' }
            }
        }
    });
}
// Function to create or update the total rejected applications chart
function createTotalRejectedChart(totalApplications, filteredApplications) {
    const ctx = document.getElementById('totalRejectedChart').getContext('2d');
    if (totalRejectedChart instanceof Chart) {
        totalRejectedChart.destroy(); // Destroy previous chart instance
    }

    const monthlyRejectedData = Array(12).fill(0); // Initialize monthly data
    filteredApplications.forEach(applicationDetails => {
        const status = applicationDetails.applicationStatus ? applicationDetails.applicationStatus.toLowerCase().trim() : '';
        if (status === "rejected") {
            const dateFiling = applicationDetails.applicationDetails?.dateFiling;
            const date = dateFiling ? new Date(dateFiling) : null;

            // Check if date is valid
            if (date && !isNaN(date)) {
                const month = date.getMonth(); // Get month (0-11)
                monthlyRejectedData[month] += 1; // Increment the count for the corresponding month
            }
        }
    });

    totalRejectedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [{
                label: 'Total Rejected Applications by Month',
                data: monthlyRejectedData, // Use the rejected monthly data
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                title: { display: true, text: 'Total Rejected Applications by Month' }
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
        const status = application.applicationStatus ? application.applicationStatus.toLowerCase().trim() : 'pending'; // Default value

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

    // Destroy previous chart instance if it exists
    if (applicantsOverTimeChart instanceof Chart) {
        applicantsOverTimeChart.destroy(); // Destroy previous chart instance
    }

    // Create the new pie chart
    applicantsOverTimeChart = new Chart(ctx, {
        type: 'doughnut',
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

    // Define sizes for images
    const imageWidth = 70; // Set desired width
    const imageHeight = 70; // Set desired height
    const pageWidth = doc.internal.pageSize.getWidth();
    const imageXPositionLeft = 14; // Left column position
    const imageXPositionRight = pageWidth - imageWidth - 14; // Right column position

    // Initialize vertical position for images
    let yPosition = 40;

    // Create an array of charts to loop through
    const charts = [
        applicantsOverTimeChart,
        totalApplicationsChart,
        totalAccreditedChart,
        totalReAccreditedChart,
        totalRejectedChart
    ];

    // Loop through each chart and add it to the PDF
    charts.forEach((chart, index) => {
        if (chart) {
            const chartImage = chart.toBase64Image(); // Convert chart to base64 image
            // Determine the x position based on the column (0 = left, 1 = right)
            const xPosition = index % 2 === 0 ? imageXPositionLeft : imageXPositionRight;

            // Add the chart image to the PDF
            doc.addImage(chartImage, 'PNG', xPosition, yPosition, imageWidth, imageHeight); 

            // Update the y position for the next row after every two images
            if (index % 2 === 1) {
                yPosition += imageHeight + 10; // Increase yPosition for the next row (10px gap)
            }
        }
    });

    // If there's an odd chart, ensure the next start for table does not overlap
    if (charts.length % 2 !== 0) {
        yPosition += imageHeight + 10; // Extra space if there was an unpaired image
    }

    // Add data table title
    doc.setFontSize(12);
    doc.text("Data Table", 14, yPosition); // Position table title below charts
    yPosition += 10; // Add space before the table

    // Prepare data for the table (including pie chart data)
    const pieChartData = applicantsOverTimeChart?.data.datasets[0].data.map((value, index) => {
        return {
            label: applicantsOverTimeChart.data.labels[index],
            value: value
        };
    }) || [];

    // Gather total applications data
    const totalApplications = totalApplicationsChart?.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0; // Sum all values
    const totalAccredited = totalAccreditedChart?.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0; // Sum all values
    const totalReAccredited = totalReAccreditedChart?.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0; // Sum all values
    const totalRejected = totalRejectedChart?.data.datasets[0]?.data.reduce((a, b) => a + b, 0) || 0; // Sum all values

    const tableData = [
        { label: 'Total Applications', value: totalApplications },
        { label: 'Accredited Applications', value: totalAccredited },
        { label: 'Reaccredited Applications', value: totalReAccredited },
        { label: 'Rejected Applications', value: totalRejected }
    ].concat(pieChartData);  // Combine existing table data with pie chart data

    // Add table with jsPDF autoTable plugin
    doc.autoTable({
        head: [['Category', 'Applications']],
        body: tableData.map(item => [item.label, item.value]),
        startY: yPosition, // Adjust table start position after charts
    });

    // Save the PDF
    doc.save(`Applications_Report_${new Date().toLocaleDateString()}.pdf`);
}

// Attach event listener to download button
document.getElementById('downloadReport').addEventListener('click', function () {
    generatePDFReport();
});
