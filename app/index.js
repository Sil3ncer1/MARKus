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

const { initDatabase, User, File } = require('./database/database');

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
  if (!req.file) {
      return res.status(400).send('Keine Datei hochgeladen.');
  }

  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).send('Keine Benutzer-ID angegeben.');
  }

  try {
    // Erstelle ein neues File-Objekt in der Datenbank
    const file = await File.create({
      filename: req.file.filename,
      userId: userId
    });

    console.log('Datei hochgeladen:', file.toJSON());

    res.send('Datei erfolgreich hochgeladen: ' + req.file.filename);
  } catch (error) {
    console.error('Fehler beim Speichern der Datei:', error);
    res.status(500).send('Fehler beim Speichern der Datei.');
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
              avatarUrl: userData.avatar_url
          }
      });

      console.log(created ? 'Benutzer angelegt:' : 'Benutzer existiert bereits:', user.toJSON());

      // Weiterleitung zu success.html mit dem Token in der URL
      res.redirect(`/success.html?accessToken=${accessToken}&userId=${user.id}`);
  } catch (error) {
      console.error('Fehler beim Authentifizierungsprozess:', error.response?.data || error.message);
      res.status(500).send('Fehler beim Authentifizierungsprozess.');
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

