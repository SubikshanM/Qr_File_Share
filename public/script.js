const form = document.getElementById('uploadForm');
const fileTypeSelect = document.getElementById('fileTypeSelect');
const fileInput = document.getElementById('fileInput');
const qrCodeImg = document.getElementById('qr-code');
const fileNamePreview = document.getElementById('file-name-preview');
const fileNameSpan = document.getElementById('fileName');
const loadingSpinner = document.getElementById('loading-spinner');

// ADDED ELEMENTS
const linkContainer = document.getElementById('link-container');
const shortenedLinkInput = document.getElementById('shortenedLink');
const fullLinkInput = document.getElementById('fullLink');
const copyButton = document.getElementById('copyButton');


// Function to update button disabled states
function updateButtonStates() {
    const fileTypeSelected = fileTypeSelect.value !== '';
    const fileSelected = fileInput.files.length > 0;
    document.querySelector('button[type="submit"]').disabled = !(fileTypeSelected && fileSelected);
}

// Enable file input when a file type is selected
fileTypeSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        fileInput.disabled = false;
        fileInput.accept = e.target.value;
    } else {
        fileInput.disabled = true;
        fileInput.accept = '';
    }
    updateButtonStates();
});

// Show the selected file's name and update button states
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
        fileNamePreview.style.display = 'block';
    } else {
        fileNamePreview.style.display = 'none';
    }
    updateButtonStates();
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // ADDED: Reset visibility of link elements
    linkContainer.style.display = 'none'; 
    shortenedLinkInput.value = '';
    fullLinkInput.value = '';
    
    // Show the loading spinner and hide the QR code
    loadingSpinner.style.display = 'block';
    qrCodeImg.style.display = 'none';

    const currentUrl = window.location.origin;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('host', currentUrl);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        // Check for all required data from the server
        if (data.qrCodeUrl && data.fileUrl && data.shortenedLink) {
            // Display QR Code
            qrCodeImg.src = data.qrCodeUrl;
            qrCodeImg.style.display = 'block';
            
            // Display BOTH Links
            fullLinkInput.value = data.fileUrl;
            shortenedLinkInput.value = data.shortenedLink;
            linkContainer.style.display = 'flex';

        } else if (data.qrCodeUrl && data.fileUrl) {
             // Fallback if shortening fails
            qrCodeImg.src = data.qrCodeUrl;
            qrCodeImg.style.display = 'block';
            fullLinkInput.value = data.fileUrl;
            shortenedLinkInput.value = "Shortening Failed. Use Full Link.";
            linkContainer.style.display = 'flex';
        } else {
            alert('File uploaded, but essential link data was missing from the server.');
        }

    } catch (error) {
        console.error('Error:', error);
        alert('File upload failed.');
    } finally {
        // Hide the loading spinner when the process is complete
        loadingSpinner.style.display = 'none';
    }
});

// ADDED: Copy Button Functionality (Copies the Shortened Link)
copyButton.addEventListener('click', () => {
    shortenedLinkInput.select();
    shortenedLinkInput.setSelectionRange(0, 99999); 
    
    // Use the Clipboard API to copy the text
    navigator.clipboard.writeText(shortenedLinkInput.value)
        .then(() => {
            // Provide visual feedback
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.textContent = 'Copy Shortened Link';
            }, 2000);
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy link. Please copy it manually.');
        });
});

// Initial state update when the page loads
document.addEventListener('DOMContentLoaded', updateButtonStates);