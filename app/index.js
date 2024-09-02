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
  }
,html: true})
.use(require('markdown-it-highlightjs'))
.use(require('markdown-it-task-lists'),{enabled: true});


const app = express();
const port = 3000;

require('dotenv').config();
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

TurndownService.prototype.escape = function (string) {
  return string;
} 


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
            ||  node.classList.contains('task-list-item-checkbox')
            ||  node.id == 'settings-preview-window-container')
          )

    return attrTest;
  },
  replacement: (innerHTML, node) => node.outerHTML
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const { sequelize, User, File, Directory, initDatabase } = require('./database/database');


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
      const [user, created] = await User.findOrCreate({
          where: { githubId: userData.id.toString() },
          defaults: {
              login: userData.login,
              name: userData.name,
              accessToken: accessToken,
              avatarUrl: userData.avatar_url
          }
      });

      if (created) {
          // Create a Root Directory for the user
          await Directory.create({
              name: 'Root',
              userId: user.id,
              parent: null
          });

      }

      console.log(created ? 'User Created:' : 'User already exists:', user.toJSON());

      res.redirect(`/success.html?accessToken=${accessToken}`);
  } catch (error) {
      console.error('Fehler beim Authentifizierungsprozess:', error.response?.data || error.message);
      res.status(500).send('Fehler beim Authentifizierungsprozess.');
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
  if (!userId) return res.status(400).send('No user id provided.');

  const parentId = req.body.parentId;
  if (!parentId) return res.status(400).send('No parent id provided.');

  const filename = Date.now() + '-' + req.body.filename + '.md';
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
    return res.status(400).send('No user id provided.');
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
    return res.status(400).send('No user id provided.');
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
    return res.status(400).send('Name oder Benutzer-ID fehlt.');
  }

  try {
    // Create a new Directory
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


app.post('/delete-folder', async (req, res) => {
  const { objectID, userId } = req.body;

  if (!objectID || !userId) {
    return res.status(400).send('Folder ID oder Benutzer-ID fehlt.');
  }

  try {
    const deleteFolderRecursively = async (objectID) => {
      const subfolders = await Directory.findAll({ where: { parentId: objectID } });

      for (const subfolder of subfolders) {
        await deleteFolderRecursively(subfolder.id);
      }

      await File.destroy({ where: { id: objectID } });

      await Directory.destroy({ where: { id: objectID } });
    };

    await deleteFolderRecursively(objectID);

    res.status(200).send('Ordner und alle Unterelemente erfolgreich gelöscht.');
  } catch (error) {
    console.error('Fehler beim Löschen des Ordners:', error);
    res.status(500).send('Fehler beim Löschen des Ordners.');
  }
});

app.post('/delete-file', async (req, res) => {
  const { objectID, userId } = req.body;

  if (!objectID || !userId) {
    return res.status(400).send('Folder ID oder Benutzer-ID fehlt.');
  }

  try {

    await File.destroy({ where: { id: objectID } });

    res.status(200).send('Ordner und alle Unterelemente erfolgreich gelöscht.');
  } catch (error) {
    console.error('Fehler beim Löschen des Ordners:', error);
    res.status(500).send('Fehler beim Löschen des Ordners.');
  }
});





app.get('/get-user-by-token', async (req, res) => {
  const accessToken = req.query.accessToken; 

  if (!accessToken) {
      return res.status(400).send('Access Token not provided.');
  }

  try {
      const user = await User.findOne({
          where: { accessToken: accessToken }
      });

      if (!user) {
          return res.status(404).send('Didnt find user.');
      }

      res.json({ userId: user.id }); 
  } catch (error) {
    console.error('Error finding the user:', error);
    res.status(500).send('Error finding the user.');
  }
});


app.get('/getRootByUserId', async (req, res) => {
  const { userId } = req.query; // Benutzer-ID als Query-Parameter erhalten

  if (!userId) {
      return res.status(400).send('userId fehlt.');
  }

  try {
      // Suche das Root-Verzeichnis anhand der userId und parentId null
      const root = await Directory.findOne({
          where: {
              userId: userId,
              parentId: null // Root-Verzeichnisse haben keinen Elternordner
          }
      });

      if (!root) {
          return res.status(404).send('Root-Verzeichnis nicht gefunden.');
      }

      // Root-Verzeichnis gefunden, sende es zurück
      res.json(root);
  } catch (error) {
      console.error('Fehler beim Abrufen des Root-Verzeichnisses:', error);
      res.status(500).send('Fehler beim Abrufen des Root-Verzeichnisses.');
  }
});


app.get('/getFileById', async (req, res) => {
  const { ownId } = req.query; // Benutzer-ID als Query-Parameter erhalten

  console.log("id: " + ownId);

  if (!ownId) {
      return res.status(400).send('userId fehlt.');
  }


  try {
      // Suche das Root-Verzeichnis anhand der userId und parentId null
      const file = await File.findOne({
          where: {
            id: ownId
          }
      });

      if (!file) {
          return res.status(404).send('Root-Verzeichnis nicht gefunden.');
      }

      // Root-Verzeichnis gefunden, sende es zurück
      res.json(file);
  } catch (error) {
      console.error('Fehler beim Abrufen des Root-Verzeichnisses:', error);
      res.status(500).send('Fehler beim Abrufen des Root-Verzeichnisses.');
  }
});



app.post('/convert', (req, res) => {
  const html = md.render(req.body.markdown);
  res.send(html);
});



app.post('/convertToMarkdown', (req, res) => {
  const markdown = turndownService.turndown(req.body.html);
  res.send(markdown);
});

app.post('/generateString', (req, res) => {
    const randexp = new RandExp(new RegExp(req.body.regex, 'gm'));
    randexp.max = 0;
    res.send(randexp.gen());

});

app.listen(port, () => {
  console.log(`Server gestartet auf http://localhost:${port}`);
});

