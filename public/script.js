const form = document.getElementById('uploadForm');
const fileTypeSelect = document.getElementById('fileTypeSelect');
const fileInput = document.getElementById('fileInput');
const qrCodeImg = document.getElementById('qr-code');
const fileNamePreview = document.getElementById('file-name-preview');
const fileNameSpan = document.getElementById('fileName');

// Enable file input when a file type is selected
fileTypeSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        fileInput.disabled = false;
        fileInput.accept = e.target.value;
    } else {
        fileInput.disabled = true;
        fileInput.accept = '';
    }
});

// Show the selected file's name
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        fileNameSpan.textContent = fileInput.files[0].name;
        fileNamePreview.style.display = 'block';
    } else {
        fileNamePreview.style.display = 'none';
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

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

        if (data.qrCodeUrl) {
            qrCodeImg.src = data.qrCodeUrl;
            qrCodeImg.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('File upload failed.');
    }
});