const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse URL-encoded bodies and JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up a storage location for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  // This line sets the file size limit to 250 MB (in bytes)
  limits: { fileSize: 250 * 1024 * 1024 } 
});

// Serve static files from a public directory (for the frontend HTML/CSS/JS)
app.use(express.static('public'));

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  // Use the host from the request body sent by the frontend
  const host = req.body.host;
  
  // Generate a unique URL for the file
  const fileUrl = `${host}/download/${req.file.originalname}`;

  // Generate the QR code as a data URL
  qrcode.toDataURL(fileUrl, (err, qrCodeUrl) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error generating QR code.');
    }
    res.json({ fileUrl, qrCodeUrl });
  });
});

// File download route
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      // Clean up the file after a successful download or error
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });
      res.status(404).send('File not found or download failed.');
    }
    console.log(`File downloaded: ${req.params.filename}`);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});