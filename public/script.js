const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const qrCodeImg = document.getElementById('qr-code');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get the current URL from the browser's address bar
    const currentUrl = window.location.origin;

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    // Append the current host to the form data
    formData.append('host', currentUrl);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();
        
        if (data.qrCodeUrl) {
            qrCodeImg.src = data.qrCodeUrl;
            qrCodeImg.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('File upload failed.');
    }
});