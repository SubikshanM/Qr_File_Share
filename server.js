// server.js (Finalized - Simple Full Link)

const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
// MODIFIED: REMOVED const fetch = require('node-fetch');

const app = express();
// Using environment variable PORT for hosting, falling back to 3000 locally
const PORT = process.env.PORT || 3000; 

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
    // MODIFIED: Use a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 250 * 1024 * 1024 } // 250 MB limit
});

// Serve static files from a public directory (for the frontend HTML/CSS/JS)
app.use(express.static('public'));

// File download route
app.get('/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found or has expired.');
  }
  
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).send('File not found or download failed.');
    }
    console.log(`File downloaded: ${req.params.filename}`);
  });
});

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  try {
    const host = req.body.host;
    const filename = req.file.filename; 

    // 1. Construct the Full Download URL (fileUrl)
    const fileUrl = `${host}/download/${filename}`;

    // 2. Generate the QR code as a data URL
    const qrCodeUrl = await qrcode.toDataURL(fileUrl);
    
    // 3. Send only the full link back to the client
    res.json({ 
        fileUrl: fileUrl, 
        qrCodeUrl: qrCodeUrl
    });

  } catch (err) {
    console.error('Error processing file and generating links:', err);
    res.status(500).send('Error processing file and generating links.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});