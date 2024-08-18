const express = require('express');
const bodyParser = require('body-parser');
const RandExp = require('randexp');
const markdownIt = require('markdown-it');
const highlightJs = require('highlight.js');

const fs = require('fs');
const axios = require('axios');
const path = require('path');
const multer = require('multer');

const md = require('markdown-it')({
  highlight: function (str, lang) {
    if (lang && highlightJs.getLanguage(lang)) {
      try {
        return highlightJs.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  },
  html: true
})
.use(require('markdown-it-highlightjs'))
.use(require('markdown-it-task-lists'), { enabled: true });

const app = express();
const port = 3000;

require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

TurndownService.prototype.escape = function (string) {
  return string;
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  codeBlock: (code, info) => {
    const language = info ? info : '';
    return '```' + language + '\n' + code + '\n```';
  },
});

turndownService.keep(['iframe', 'script', 'object', 'link', 'style']);
turndownService.use(turndownPluginGfm.gfm);

turndownService.addRule('strikethrough', {
  filter: ['del', 's', 'strike'],
  replacement: function (content) {
    return '~~' + content + '~~';
  },
});

// From: https://github.com/mixmark-io/turndown/issues/180
turndownService.addRule('keepattributes', {
  filter: function (node) {
    let attributes = ['class', 'style', 'is', 'id'],
        attrTest = attributes.some(attr => 
          node.hasAttribute(attr) && 
          !(
            node.classList.contains('task-list-item') 
            || node.classList.contains('contains-task-list') 
            || node.classList.contains('task-list-item-checkbox')
            || node.id == 'settings-preview-window-container')
          );

    return attrTest;
  },
  replacement: (innerHTML, node) => node.outerHTML
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const { sequelize, User, File, Directory, initDatabase } = require('./database/database');

// Initialize the database
initDatabase().then(() => {
    console.log('Database initialized.');
}).catch((error) => {
    console.error('Error initializing the database:', error);
});

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'database/uploads/'); // Directory where files will be stored
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Filename
  }
});

const upload = multer({ storage: storage });

// Route for file upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
    
  const userId = req.body.userId;
  if (!userId) return res.status(400).send('No user ID provided.');

  const parentId = req.body.parentId;
  if (!parentId) return res.status(400).send('No parent ID provided.');
  
  try {
    // Check if the directory exists
    const parentDirectory = await Directory.findByPk(parentId);
    if (!parentDirectory) {
        return res.status(400).send('The specified directory does not exist.');
    }

    // Create a new File object in the database
    const file = await File.create({
      filename: req.file.filename,
      userId: userId,
      directoryId: parentId 
    });

    console.log('File uploaded:', file.toJSON());

    res.send('File successfully uploaded: ' + req.file.filename);
  } catch (error) {
    console.error('Error saving the file:', error);
    res.status(500).send('Error saving the file.');
  }
});

app.post('/create-empty-file', async (req, res) => {    
  const userId = req.body.userId;
  if (!userId) return res.status(400).send('No user ID provided.');

  const parentId = req.body.parentId;
  if (!parentId) return res.status(400).send('No parent ID provided.');

  const filename  = req.body.filename + '.md';
  if (!filename) return res.status(400).send('No filename provided.');
  
  const filePath = path.join(__dirname, 'database/uploads', filename);

  fs.writeFile(filePath, '', (err) => {
      if (err) {
          console.error('Error creating the file:', err);
          return res.status(500).send('Error creating the file.');
      }
      res.status(200).send('File successfully created.');
  });

  const file = await File.create({
    filename: filename,
    userId: userId,
    directoryId: parentId 
  });

  console.log('File created:', file.toJSON());
});

app.get('/get-file-from-server/:filename', async (req, res) => {
  try {
      const filename = req.params.filename;

      const filePath = path.join(__dirname, 'database', 'uploads', filename);

      res.sendFile(filePath);
  } catch (error) {
      console.error('Error fetching the file:', error);
      res.status(500).send('Error fetching the file');
  }
});

app.get('/getFiles', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send('No user ID provided.');
  }

  try {
    // Find all files belonging to the user
    const files = await File.findAll({
      where: { userId: userId }
    });

    // Send the files as a JSON response
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send('Error fetching files.');
  }
});

app.get('/getDirs', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send('No user ID provided.');
  }

  try {
    // Find all directories belonging to the user
    const dirs = await Directory.findAll({
      where: { userId: userId }
    });

    // Send the directories as a JSON response
    res.json(dirs);
  } catch (error) {
    console.error('Error fetching directories:', error);
    res.status(500).send('Error fetching directories.');
  }
});

app.get('/getFiles', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) return res.status(400).send('No user ID provided.');

  try {
    // Find all files belonging to the user
    const files = await File.findAll({
      where: { userId: userId }
    });

    // Send the files as a JSON response
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).send('Error fetching files.');
  }
});

// Route to create a new folder
app.post('/create-folder', async (req, res) => {
  const { name, userId, parentId } = req.body;

  if (!name || !userId) {
    return res.status(400).send('Name or user ID missing.');
  }

  try {
      // Create a new folder
      const folder = await Directory.create({
          name: name,
          userId: userId,
          parentId: parentId
      });

      res.json(folder);
  } catch (error) {
      console.error('Error creating the folder:', error);
      res.status(500).send('Error creating the folder.');
  }
});

// Root route to send the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Callback route for GitHub OAuth
app.get('/auth/github/callback/', async (req, res) => {
  const code = req.query.code;

  if (!code) {
      return res.status(400).send('Missing code in request.');
  }

  try {
      // Exchange the code for an access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
      }, {
          headers: {
              accept: 'application/json'
          }
      });

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
          console.error('No access token received:', tokenResponse.data);
          return res.status(500).send('Error fetching the access token.');
      }

      // Fetch user data from GitHub
      const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
              Authorization: `token ${accessToken}`
          }
      });

      const userData = userResponse.data;

      // Save the user data to the database
      let user = await User.findOne({ where: { githubId: userData.id } });

      if (!user) {
          user = await User.create({
              githubId: userData.id,
              username: userData.login,
              avatarUrl: userData.avatar_url,
          });
      }

      // Redirect to the user page
      res.redirect(`/user/${user.id}`);
  } catch (error) {
      console.error('Error during GitHub OAuth process:', error.message);
      res.status(500).send('Error during GitHub OAuth process.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
