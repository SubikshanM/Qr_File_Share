// server.js (Finalized with TinyURL Link Shortening)

const express = require('express');
const multer = require('multer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
// You might need to install 'node-fetch' if your Node.js version is older than 18
const fetch = require('node-fetch'); 

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
    // MODIFIED: Use a unique filename to prevent collisions (original code used file.originalname which is risky)
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
      // Your original logic here:
      // fs.unlink(filePath, (unlinkErr) => {
      //   if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      // });
      res.status(404).send('File not found or download failed.');
    }
    console.log(`File downloaded: ${req.params.filename}`);
  });
});

// File upload route
app.post('/upload', upload.single('file'), async (req, res) => { // MODIFIED: ADDED 'async'
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  try {
    const host = req.body.host;
    // Use the newly generated unique filename
    const filename = req.file.filename; 

    // 1. Construct the Full Download URL (fileUrl)
    const fileUrl = `${host}/download/${filename}`;

    let shortenedLink = fileUrl; // Default to full link

    // 2. Call the TinyURL API
    const T_URL = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(fileUrl)}`;

    try {
        const shorteningResponse = await fetch(T_URL);
        
        if (shorteningResponse.ok) {
            // TinyURL returns the raw shortened URL as plain text
            shortenedLink = await shorteningResponse.text();
        } else {
            console.warn("TinyURL API failed with status:", shorteningResponse.status);
        }
    } catch (shorteningError) {
        console.error("Error connecting to TinyURL:", shorteningError.message);
    }

    // 3. Generate the QR code as a data URL
    const qrCodeUrl = await qrcode.toDataURL(fileUrl);
    
    // 4. Send all three back to the client
    res.json({ 
        fileUrl: fileUrl, // Full Link
        qrCodeUrl: qrCodeUrl,
        shortenedLink: shortenedLink // Shortened Link (or the full link if API failed)
    });

  } catch (err) {
    console.error('Error processing file and generating links:', err);
    res.status(500).send('Error processing file and generating links.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});