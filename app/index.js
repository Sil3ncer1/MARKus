const express = require('express');
const bodyParser = require('body-parser');
const RandExp = require('randexp');
const markdownIt = require('markdown-it');
const highlightJs = require('highlight.js');

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

const CLIENT_ID = 'Ov23liTsBVLk8CrUWAyW';
const CLIENT_SECRET = 'b3b25e4981bb07f870e3ab5dce363746b9267a52'; 


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

// Initialisiere die Datenbank
initDatabase().then(() => {
    console.log('Datenbank initialisiert.');
}).catch((error) => {
    console.error('Fehler beim Initialisieren der Datenbank:', error);
});


// Speicher-Konfiguration für multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'database/uploads/'); // Verzeichnis, in dem die Dateien gespeichert werden
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Dateiname
  }
});


const upload = multer({ storage: storage });

// Route für den Dateiupload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).send('Keine Datei hochgeladen.');
    
  const userId = req.body.userId;
  if (!userId) return res.status(400).send('Keine Benutzer-ID angegeben.');

  const parentId = req.body.parentId;
  if (!parentId) return res.status(400).send('Keine Parent-ID angegeben.');
  
  try {
    // Überprüfen, ob das Verzeichnis existiert
    const parentDirectory = await Directory.findByPk(parentId);
    if (!parentDirectory) {
        return res.status(400).send('Das angegebene Verzeichnis existiert nicht.');
    }

    // Erstelle ein neues File-Objekt in der Datenbank
    const file = await File.create({
      filename: req.file.filename,
      userId: userId,
      directoryId: parentId 
    });

    console.log('Datei hochgeladen:', file.toJSON());

    res.send('Datei erfolgreich hochgeladen: ' + req.file.filename);
  } catch (error) {
    console.error('Fehler beim Speichern der Datei:', error);
    res.status(500).send('Fehler beim Speichern der Datei.');
  }
});


app.get('/getFiles', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send('Keine Benutzer-ID angegeben.');
  }

  try {
    // Suche nach allen Dateien des Benutzers
    const files = await File.findAll({
      where: { userId: userId }
    });

    // Sende die Dateien als JSON-Antwort zurück
    res.json(files);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dateien:', error);
    res.status(500).send('Fehler beim Abrufen der Dateien.');
  }
});

app.get('/getDirs', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(400).send('Keine Benutzer-ID angegeben.');
  }

  try {
    // Suche nach allen Verzeichnissen des Benutzers
    const dirs = await Directory.findAll({
    where: { userId: userId }
  });

    // Sende die Verzeichnisse als JSON-Antwort zurück
    res.json(dirs);
  } catch (error) {
    console.error('Fehler beim Abrufen der Verzeichnisse:', error);
    res.status(500).send('Fehler beim Abrufen der Verzeichnisse.');
  }
});

app.get('/getFiles', async (req, res) => {
  const userId = req.query.userId;

  if (!userId) return res.status(400).send('Keine Benutzer-ID angegeben.');

  try {
    // Suche nach allen Dateien des Benutzers
    const files = await File.findAll({
      where: { userId: userId }
    });

    // Sende die Dateien als JSON-Antwort zurück
    res.json(files);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dateien:', error);
    res.status(500).send('Fehler beim Abrufen der Dateien.');
  }
});


// Route zum Erstellen eines neuen Ordners
app.post('/create-folder', async (req, res) => {
  const { name, userId, parentId } = req.body;

  if (!name || !userId) {
    return res.status(400).send('Name oder Benutzer-ID fehlt.');
  }

  try {
      // Erstelle einen neuen Ordner
      const folder = await Directory.create({
          name: name,
          userId: userId,
          parentId: parentId
      });

      res.json(folder);
  } catch (error) {
      console.error('Fehler beim Erstellen des Ordners:', error);
      res.status(500).send('Fehler beim Erstellen des Ordners.');
  }
});




// Root-Route, um die index.html zu senden
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Callback-Route für GitHub OAuth
app.get('/auth/github/callback/', async (req, res) => {
  const code = req.query.code;

  if (!code) {
      return res.status(400).send('Fehlender Code in der Anfrage.');
  }

  try {
      // Tausche den Code gegen einen Access Token aus
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
          console.error('Kein Access Token erhalten:', tokenResponse.data);
          return res.status(500).send('Fehler beim Abrufen des Access Tokens.');
      }

      // Benutzerdaten von GitHub abrufen
      const userResponse = await axios.get('https://api.github.com/user', {
          headers: {
              Authorization: `token ${accessToken}`
          }
      });

      const userData = userResponse.data;

      // Benutzer in der Datenbank speichern
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
          // Erstelle ein Root-Verzeichnis für den neuen Benutzer
          await Directory.create({
              name: 'Root', // Name für das Root-Verzeichnis
              userId: user.id,
              parent: null
          });

          console.log('Root-Verzeichnis für den neuen Benutzer erstellt.');
      }

      console.log(created ? 'Benutzer angelegt:' : 'Benutzer existiert bereits:', user.toJSON());

      // Weiterleitung zu success.html mit dem Token in der URL
      res.redirect(`/success.html?accessToken=${accessToken}`);
  } catch (error) {
      console.error('Fehler beim Authentifizierungsprozess:', error.response?.data || error.message);
      res.status(500).send('Fehler beim Authentifizierungsprozess.');
  }
});



app.get('/get-user-by-token', async (req, res) => {
  const accessToken = req.query.accessToken; // Den Token als Query-Parameter abfragen

  if (!accessToken) {
      return res.status(400).send('Access Token fehlt.');
  }

  try {
      const user = await User.findOne({
          where: { accessToken: accessToken }
      });

      if (!user) {
          return res.status(404).send('Benutzer nicht gefunden.');
      }

      res.json({ userId: user.id }); // Nur die userId zurückgeben
  } catch (error) {
      console.error('Fehler beim Abrufen des Benutzers:', error);
      res.status(500).send('Fehler beim Abrufen des Benutzers.');
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

