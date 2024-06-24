

<h1 style="text-align: center;">MARKus</h1>

* * *

<h2 style="text-align: center;">⋆⭒˚｡⋆ <em>Single Page View Markdown Editor</em> ⋆⭒˚｡⋆</h2>

* * *

## Description

Based on the Idea of a Single Page Editor from [MarkTwo](https://github.com/anthonygarvan/marktwo) we created our own Markdown editor around that concept. The editor exchanges Markdown and HTML block by block seamlessly via the help of [`markdown-it`](https://github.com/markdown-it/markdown-it) and [`turndown`](https://github.com/mixmark-io/turndown).

* * *

## Features

*   Single Page View - _Switch_ between **Markdown** and **HTML** Blocks
*   Snippets - _Create_ your own **Markdown** rules via **RegEx**
*   Dark Mode - for everyone who doesn't like to be _blinded_
*   Drag & Drop Files - Just **Drag** & **Drop** your Markdown Files into the Editor
*   Export - Export as Markdown or HTML file
*   CommonMark & GFM - CommonMark and GitHub Flavored Markdown already included _**wow**_ !
*   Context Menu - use the right click to fast edit entire blocks !
*   Offline saves - the local storage of the browser is used to save and auto save the file

* * *

## Still To-Do

*   Database + Profiles for Cloud Storage e.g Files and Pictures
*   Collaborative writing
*   Presentation + Document View
*   More Settings
    *   Hotkeys
    *   Safety Settings
    *   Preferable Markdown Syntax
    *   ...
*   QoL Stuff

* * *

## Installation

```
# install dependencies
npm install

# serve with hot reload at localhost:3000
node .

```

* * *

## Tech used

### Backend

*   [Node.js](https://nodejs.org/en): Free, open-source, cross-platform JavaScript runtime environment
*   [Express.js](https://expressjs.com/): Fast, unopinionated, minimalist web framework for Node.js

### Parser

*   [markdown-it](https://github.com/markdown-it/markdown-it): Markdown --> HTML Parser
*   [turndown](https://github.com/mixmark-io/turndown): HTML --> Markdown Parser

### Prototyping

*   [Figma](https://www.figma.com) - Figma is a collaborative web application for interface design