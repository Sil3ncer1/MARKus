const express = require('express');
const bodyParser = require('body-parser');
const RandExp = require('randexp');
const markdownIt = require('markdown-it');
const highlightJs = require('highlight.js');

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

const TurndownService = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');

TurndownService.prototype.escape = function (string) {
  return string;
} 

const app = express();
const port = 3000;

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

