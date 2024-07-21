document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('settings')) LoadSettings();
  if (localStorage.getItem('snippets')) loadSavedSnippets();
  

  if (!loadAutoSave()) {
    if (localStorage.getItem('documentText')) loadLastFile();
    else loadExample();
    // showEmptyLineContainer();
  }

  makeAllElementsEditable();

  enableDragAndDrop();
  setDocumentStats();

  enableDragAndDropFiles();
  addEventListenersToContextMenu();

  
  loadSnippetCards();
});



// To-Do Client side form / save implementation
const customPlugins = [];

let SnippetID = 0;

const MarkdownPlugin = function(id, name, icon, toHtmlregex, toHtml, toMarkdownregex, toMarkdown) {
  this.id = id;
  this.name = name;
  this.icon = icon;
  this.toHtmlregex = toHtmlregex;
  this.toHtml = toHtml;
  this.toMarkdownregex = toMarkdownregex;
  this.toMarkdown = toMarkdown;
};


/**
 * Function to create a MarkdownPlugin Object
 * @param {string, string, string, string, string} markdownText
 * @return {MarkdownPlugin} 
 */
function createPlugin(name, icon, baseRegex, baseHtml){
  const toHtmlregex = convertRegexPattern(baseRegex);
  const toHtml = baseHtml;
  const toMarkdownregex = convertHTML(baseHtml);
  const toMarkdown = generateStringFromRegex(baseRegex);

  const customPlugin = new MarkdownPlugin(
    SnippetID++,
    name,
    icon,
    toHtmlregex,
    toHtml,
    toMarkdownregex, 
    toMarkdown
  );

  return customPlugin;
}

/**
 * Convert the replacementString to toHtmlregex
 * @param {string} replacementString
 * @return {string} 
 */
function convertRegexPattern(replacementString) {
  const regexPattern = replacementString.replace(/\\\$\d/g, '(.+?)');
  return regexPattern;
}

/**
 * Convert the replacementHTMLString to toMarkdownregex
 * @param {string} replacementHTMLString
 * @return {string} 
 */
function convertHTML(replacementHTMLString) {
  const regexPattern = replacementHTMLString.replace(/\\\$\d/g, '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\\\$\d/g, '(.+?)');
  return regexPattern;
}

/**
 * Convert the replacementHTMLString to toMarkdown
 * @param {string} regex
 * @return {string} 
 */
function generateStringFromRegex(regex){
  const regexString = regex.replace(/\\/g, '');
  return regexString;
}

// TO-DO Think about 3 inputs or 5 (some problems in the conversion still occur e.g. special regex rules like \W )
// customPlugins.push(importantPlugin1);

const importantPlugin1 = new MarkdownPlugin(
  "blue",
  String.raw`\^(\d{2})`,
  `<sub style="color: var(--accentColor)">$1</sub>`,
  String.raw`<sub style="color: var\(--accentColor\)">(.*)<\/sub>`, 
  "^$1"
);

customPlugins.push(createPlugin(
  "sub", 
  null,
  String.raw`\^\$1`, 
  `<strong><sub style="color: var(--codeVariable)">$1</sub></strong>`
  ));

customPlugins.push(createPlugin(
  "spoiler",
  null,
  String.raw`\?\?\$1\?\?`, 
  `<span style="color: rgb(0, 0, 0); background: black; display: inline-block; border-radius: 3px; padding: 2px;" onMouseOver="this.style.color='#FFF'" onMouseOut="this.style.color='#000'">$1</span>`
));

customPlugins.push(createPlugin(
  "customImage",
  null,
  String.raw`\!\[\$1\]\(\$2\)\{\$3\,\$4\}`,   
  `<div class="ImageContainer" style="position: relative">
    <img alt="$1" src="$2" style="width: $3px; height: $4px; transition: all 200ms ease 0s;" id="$1">
    <div class="ButtonContainer" style="position: relative" onMouseOver="(
      function(){
        let buttonBig = document.getElementById('$1bigger');
        let buttonSmall = document.getElementById('$1smaller');
        buttonBig.style.visibility = 'visible';
        buttonSmall.style.visibility = 'visible';
      }
  )();" onMouseOut="(
    function(){
      let buttonBig = document.getElementById('$1bigger');
      let buttonSmall = document.getElementById('$1smaller');
      buttonBig.style.visibility = 'hidden';
      buttonSmall.style.visibility = 'hidden';
    }
)();">
      <button id="$1bigger" class="btn" style="position: relative; visibility: hidden;" onClick="(
        function(){
          let image = document.getElementById('$1');
          let imageWidth = image.offsetWidth * 2;
          let imageHeight= image.offsetHeight * 2;
          image.style.width = imageWidth + 'px';
          image.style.height = imageHeight + 'px';
        }
    )();">+</button>
      <button id="$1smaller" class="btn" style="position: relative; visibility: hidden;" onClick="(
        function(){
          let image = document.getElementById('$1');
          let imageWidth = image.offsetWidth / 2;
          let imageHeight= image.offsetHeight / 2;
          image.style.width = imageWidth + 'px';
          image.style.height = imageHeight + 'px';
        }
    )();">-</button>
    </div>
  </div>`.replace(/\n/gm, '')
));


/**
 * Function to convert Markdown to HTML
 * @param {string} markdownText
 * @return {HTMLElement} 
 */
async function convertMarkdownToHTML(markdownText) {

  customPlugins.forEach((plugin) => {
    markdownText = markdownText.replace(new RegExp(plugin.toHtmlregex,'gi'),plugin.toHtml);
  });

  try {
    const response = await fetch('/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        markdown: markdownText
      })
    });

    return await response.text();
  } catch (error) {
    throw error;
  }
}


/**
 * Function to convert HTML to Markdown
 * @param {string} htmlText
 * @return {string} 
 */
async function convertHTMLtoMarkdown(htmlText) {
  
  customPlugins.forEach((plugin) => {
    htmlText = htmlText.replace(new RegExp(plugin.toMarkdownregex,'gi'), plugin.toMarkdown);
  });
  try {
    const response = await fetch('/convertToMarkdown', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        html: htmlText
      })
    });

    return await response.text();
  } catch (error) {
    throw error;
  }
}


// Remove the custom context menu
function removeSelection(){
  let documentDiv = document.getElementById('document-doc')
  let elementsWithClass = documentDiv.querySelectorAll('.document-editable');

  elementsWithClass.forEach(function (element) {
    element.classList.remove('document-editable-selected');
  });

  let contextMenu = document.getElementById('custom-context-menu');
  contextMenu.style.display = 'none';
}

// Event listener for exiting the website
window.addEventListener('beforeunload', (event) => {
  event.returnValue = `Are you sure you want to leave?`;
});

window.addEventListener('unload', (event) => {
  autoSaveDocument();
});


// Event listener for clicking on an element of the document
document.addEventListener('click', async (event) => {
  if(event.target.type =='checkbox') return;
  if(event.target.classList.contains("ButtonContainer") || event.target.classList.contains("btn")) return;
  removeSelection();
  replaceElementWithTextarea(event.target);
});


// Event listener for clicking on an element of the document
document.getElementById('zoom-container').addEventListener('contextmenu', async (event) => {
  // Check if there is a selection
  if (!window.getSelection().toString()) {
    event.preventDefault();
    setContextMenu(event);
  }
});


/**
 * set the values of the Context Menu
 * @param {event} event
 * @return {void} 
 */
async function setContextMenu(event) {
  let clickedElement = event.target
  clickedElement = findClosestEditableElement(clickedElement);

  removeSelection();



  if(clickedElement != null &&!clickedElement.classList.contains('document-editable-selected')  && !event.target.classList.contains('document-drag-handel')){
    clickedElement.classList.add('document-editable-selected')
    let contextMenu = document.getElementById('custom-context-menu');
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.display = 'block';
  }else{
    let contextMenu = document.getElementById('custom-context-menu');
    contextMenu.style.left = event.pageX + 'px';
    contextMenu.style.top = event.pageY + 'px';
    contextMenu.style.display = 'block';
  }
} 


let ElementID = 0;

/**
 * Creates an HTML element from an HTML string
 * @param {string} htmlString
 * @param {string} className
 * @return {HTMLDivElement} 
 */
function createHTMLElement(htmlString, className, id = -1) {
  const element = document.createElement('div');
  element.innerHTML = htmlString;

  if (id != -1) element.dataset.id = id;
  else element.dataset.id = ElementID++;

  const dragHandel = document.createElement('div');
  dragHandel.classList.add('document-drag-handel')
  dragHandel.setAttribute('draggable', true);

  dragHandel.innerHTML = '=';

  element.appendChild(dragHandel);

  if (className) element.classList.add(className);
  
  return element;
}


/**
 * Creates the Textcontainer, containing the textarea object
 * @param {string} string
 * @return {HTMLDivElement} 
 */
function createTextcontainer(string) {
  const textcontainer = document.createElement('div');
  textcontainer.id = 'document-textfield';
  
  const textarea = document.createElement('textarea');
  textarea.id = 'document-textarea';
  textarea.value = (string) ? string : "";
  
  textcontainer.appendChild(textarea);

  // The drag-handle is causing a slight offset, so we insert a version of it here
  const dragHandel = document.createElement('div');
  dragHandel.classList.add('document-drag-handel')
  dragHandel.innerHTML = '=';
  dragHandel.style.opacity = 0;
  
  textcontainer.appendChild(dragHandel);

  return textcontainer;
}

/**
 * add a new Textarea before or after an Element
 * @param {HTMLElement} element
 * @param {boolean} before
 * @return {HTMLDivElement} 
 */
function addNewTextarea(element, before) {
  const textcontainer = createTextcontainer("");
  
  const textarea = textcontainer.firstElementChild;
  
  if(element == null){
    const documentDiv = document.getElementById('document-doc');
    documentDiv.insertBefore(textcontainer, documentDiv.firstChild);
  } 
  else if (before)
    element.parentNode.insertBefore(textcontainer, element);
  else
    element.parentNode.insertBefore(textcontainer, element.nextSibling);

  addEventListenersToTextArea(textarea);


  textarea.focus();
}

/**
 * A Function that recursively returns the closest Element with the "document-editable" class 
 * @param {HTMLElement} element
 * @return {HTMLDivElement} 
 */
function findClosestEditableElement(element) {
  while (element) {
    if (element.classList.contains('document-editable'))
      return element;
    
    if (element.classList.contains('document-drag-handel'))
      return null;

    element = element.parentElement;
  }

  return null;
}




/**
 * Replace an HTML Element with an Textcontainer
 * @param {HTMLElement} clickedElement
 * @param {boolean} atBeginning
 * @return {void} 
 */
async function replaceElementWithTextarea(clickedElement, atBeginning = false) {
  clickedElement = findClosestEditableElement(clickedElement);
  
  if (!clickedElement) return;

  if (clickedElement.classList.contains('document-element-blocked')) {
    showPopup('this element is currentll edited by another user');
    return;
  }


  const htmlElement = clickedElement.firstElementChild;

  const elementID = clickedElement.dataset.id;

  if (socket) blockEditedElement(elementID);


  try {
    const fontStyle = window.getComputedStyle(htmlElement).font;

    const markdown = await convertHTMLtoMarkdown(htmlElement.outerHTML);
    const textcontainer = createTextcontainer(markdown);

    clickedElement.replaceWith(textcontainer);
    
    const textarea = textcontainer.firstElementChild;
    addEventListenersToTextArea(textarea, elementID);
    textarea.focus();

    if (atBeginning) textarea.selectionEnd = 0;

    // fit text in textarea
    if (fontStyle && htmlElement.tagName != "TABLE") textarea.style.font = fontStyle;
    if (htmlElement.tagName == "TABLE") textarea.value = formatTableMarkdown(textarea.value);
    textarea.style.height = textarea.scrollHeight + "px";


  } catch (error) {
    console.error(error);
  }
} 


/**
 * Add several EventListeners to the Textarea
 * @param {HTMLTextAreaElement} textarea
 * @return {void} 
 */
function addEventListenersToTextArea(textarea, id = -1) {
  const textcontainer = textarea.parentNode;

  const parentContainer = textcontainer.parentNode;

  textarea.addEventListener("focusout", async () => {
    const markdownText = textarea.value.trim();
    const mainDocument = document.getElementById('document-doc');

    if (markdownText === "") {
      textcontainer.remove();
      
      let today = new Date();
      let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      const fileChangedTime  = document.getElementById('settings-info-file-changed-value');
      
      fileChangedTime.innerHTML = date;
      stateManager.pushState(mainDocument.innerHTML);
      
      if (!mainDocument.hasChildNodes()) showEmptyLineContainer();
      
      console.log("remove");
      if(socket) removeElement(id);
     
      return;
    }

    try {

      const html = await convertMarkdownToHTML(markdownText);
      
      //const parsedHTML = new DOMParser().parseFromString(html, 'text/html'); next two lines fix for movin styles tag etc to head
      var htmlObjects = document.createElement('div');
      htmlObjects.innerHTML = html;
      const children = Array.from(htmlObjects.children);

      const nextSibling = textcontainer.nextElementSibling;

      for (const child of children) {
        const newTag = createHTMLElement(child.outerHTML, "document-editable", id);
        parentContainer.insertBefore(newTag, nextSibling);
      }

      textcontainer.remove();
      let today = new Date();
      let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      const fileChangedTime  = document.getElementById('settings-info-file-changed-value');
      fileChangedTime.innerHTML = date;
      stateManager.pushState(mainDocument.innerHTML);

      let elements = document.getElementsByClassName("task-list-item-checkbox");
      for (let i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', function(event) {
            if (this.checked) {
              this.setAttribute("checked", "checked");
            } else {
                this.removeAttribute("checked");
            }
        });
    }

      enableDragAndDrop();
      setDocumentStats();

      if (!document.hasChildNodes()) showEmptyLineContainer();

      // if (selectedViewMode == 1) checkIfPagesAreFull();


      // Websockets
      if(socket) documentChanged(id);

    } catch (error) {
      console.error(error);
    }
  });

  textarea.addEventListener("input", () => {
    // fit text in textarea on change
    textarea.style.height = textarea.scrollHeight + "px";
    
    // Check for a double line break
    const currentValue = textarea.value;
    const regex = /\n\s*\n/;

    if (regex.test(currentValue.slice(-2))) {
      addNewTextarea(textcontainer, false);
    }
  });


  textarea.addEventListener('keydown', e => {
    // enable tab on textarea
    if (e.key == 'Tab') {
      e.preventDefault();
      let start = textarea.selectionStart;
      let end = textarea.selectionEnd;

      // If Shift key is pressed, remove indentation
      if (e.shiftKey) {
        const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = textarea.value.substring(lineStart, start);
        const match = currentLine.match(/\s{4,}\*|\s{4,}\+|\s{4,}-|\s{4,}\d\./);

        if(match){

          // Determine the position to remove
          let removePos = start - 1;
          while (removePos >= 0 && (textarea.value[removePos] === ' ' || textarea.value[removePos] === '\t')) {
              removePos--;
          }

          // Remove the indentation
          textarea.value = textarea.value.substring(0, lineStart) + textarea.value.substring(lineStart+4, textarea.value.length);
          textarea.selectionStart = textarea.selectionEnd = end - 4;
        }
      } else {
        // Find the position of the '* . - +' before the current line break
        const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
        let lineEnd = textarea.value.indexOf('\n', start) + 1;
        if(lineEnd == 0)
        lineEnd = textarea.value.length;
        let currentLine = textarea.value.substring(lineStart, lineEnd);
        const match = currentLine.match(/\*\s{3,}|\+\s{3,}|-\s{3,}|\d\.\s{2,}/);
        let exportString ='';
        if(match){
          if(match[0].match(/\d\.\s{2,}/)){
            currentLine = currentLine.substring(0,currentLine.indexOf('.')-1) + '1' + currentLine.substring(currentLine.indexOf('.'),currentLine.length);
          }
          
          exportString = '    ' + currentLine;
          textarea.value = textarea.value.substring(0, lineStart) + exportString + textarea.value.substring(lineEnd, textarea.value.length);
          textarea.selectionStart = textarea.selectionEnd = end + 4;
        }else {

            // If no '* . - +' are found or it's not before the current line break, add indentation as before
            textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            // Put caret at the right position again
            textarea.selectionStart = textarea.selectionEnd = start + 4;
        }
      }
    }


    // Add a new line via the arrow keys
    else if (e.key == "ArrowDown") {
      if (textarea.selectionEnd == textarea.value.length && textarea.value.length != 0) addNewTextarea(textcontainer, false);
      
      else if (textarea.value.length == 0) replaceElementWithTextarea(textcontainer.nextElementSibling, true);
    }
    
    else if (e.key == "ArrowUp") {
      if (textarea.selectionEnd == 0 && textarea.value.length != 0) addNewTextarea(textcontainer, true);

      else if (textarea.value.length == 0) replaceElementWithTextarea(textcontainer.previousElementSibling);
    }

    // TO-DO:  "*   [x]  @mentions, #refs, links, **formatting**, and ~~tags~~ supported" doesnt linebreak
    else if (e.key == "Enter") {
      const cursorPos = textarea.selectionStart;
      const textLines = textarea.value.substr(0, cursorPos).split("\n");
      const textLinesRemaining = textarea.value.substr(cursorPos);
      const currentLineNumber = textLines.length - 1;

      const currentLine = textLines[currentLineNumber];
      const match = currentLine.match(/^(\s*)([0-9]+\.|\*   \[ \]|\*   \[x\]|[*\-+])\s+(\W[^\s]+|\w)+(\n|$)/);
      const matchEmptyEntry = currentLine.match(/^(\s*)([0-9]+\.|\*   \[ \]|\*   \[x\]|[*\-+])\s+[^\n]$/);
      // Get amount of tabs
      const indentationLevel = match ? match[1].length : null;
      const listType = match ? match[2] : null;
      let spaces;

      if (indentationLevel !== null && listType !== null) {
        // Add the appropriate list item to the next line with appropriate indentation
        const indentSpaces = " ".repeat(indentationLevel);
        let newItem;
        if (listType.endsWith('.')) {
          // For numbered lists, increment the number
          const currentNumber = parseInt(listType);
          newItem = (currentNumber + 1) + ".";
          spaces = '  '
        } else if (listType.endsWith(']')){
          newItem = listType;
          spaces = '  '
        }else {
            // For other lists, use the same marker
          newItem = listType;
          spaces = '   '
        }

        const newText = textarea.value.substring(0, cursorPos) + "\n" + indentSpaces + newItem + spaces + textarea.value.substring(cursorPos);
        textarea.value = newText;

        // Move the cursor to the correct position
        textarea.setSelectionRange(cursorPos + indentationLevel + newItem.length + 4, cursorPos + indentationLevel + newItem.length + spaces.length+1);

        // Prevent the default Enter behavior
        e.preventDefault();

        // Change textarea height
        textarea.style.height = textarea.scrollHeight + "px";
      }
      else if(matchEmptyEntry){
        textLines.pop();
        textarea.value = textLines.join('\n') + '\n' + textLinesRemaining;
        let endline = textarea.value.indexOf('\n',textLines.join('\n').length+2)
        textarea.setSelectionRange(endline,endline);
        // Prevent the default Enter behavior
        e.preventDefault();

        // Change textarea height
        textarea.style.height = textarea.scrollHeight + "px";
      }
    } 
  });
}


// Event listener for adding a new line
// document.getElementById("new-line").addEventListener('click', async (e) => {
//   addNewTextarea(e.target, true);
// });




/**
 * Format a given tableString
 * @param {string} table
 * @return {string} 
 */ 
function formatTableMarkdown(table) {
  let rows = table.split('\n');

  let numColumns = rows[0].split('|').length - 2;
  let maxLengths = Array(numColumns).fill(0);

  for (let i = 0; i < rows.length; i++) {
    let cells = rows[i].split('|');
    for (let j = 1; j < cells.length - 1; j++) {
      let cellValue = cells[j].trim();
      maxLengths[j - 1] = Math.max(maxLengths[j - 1], cellValue.length);
    }
  }

  let formattedTable = '';
  for (let i = 0; i < rows.length; i++) {
    let cells = rows[i].split('|');
    let formattedRow = '|';
    for (let j = 1; j < cells.length - 1; j++) {
      let cellValue = cells[j].trim();
      let padding = maxLengths[j - 1] - cellValue.length + 1;
      formattedRow += ' ' + cellValue + ' '.repeat(padding) + ' |';
    }
    formattedTable += formattedRow + '\n';
  }

  return formattedTable;
}

/**
 * Add drag- and dropping to the HTML-Elements
 * @return {void} 
 */ 
function enableDragAndDrop() {    
  // Select all elements
  let dragHandles = document.querySelectorAll('.document-drag-handel');
  let container = document.querySelectorAll('.document-editable');

  let draggedElement = null;

  // Add dragstart event for each element
  dragHandles.forEach(element => {
    element.draggable = true;

    element.addEventListener('dragstart', event => {
      draggedElement = element.parentNode.firstElementChild;
      let footer = document.getElementById('footer');
      footer.style.bottom = -2.5 + "rem"
      // Set data for the drag-and-drop operation
      event.dataTransfer.setData('text/plain', ''); 
    });

    element.addEventListener('drag', event => {
      // Prevent the default behavior to make drop work
      event.preventDefault();
    });

    element.addEventListener('dragover', event => {
      // Prevent the default behavior to make drop work
      event.preventDefault();
    });

    element.addEventListener('dragend', () => {
      footer.style.bottom = 0 + "rem"
      draggedElement = null;
    });
  });



  container.forEach(element => {
    element.addEventListener('dragover', event => {
      event.preventDefault();
    });
    
    element.addEventListener('dragenter', event => {
      element.classList.add("document-editable-hover-drop");
      event.preventDefault();
    });

    element.addEventListener('dragleave', event => {
      const target = event.relatedTarget;
    
      if (!target || (target !== element && !element.contains(target))) {
        element.classList.remove("document-editable-hover-drop");
      }
    });

    element.addEventListener('drop', event => {
      // Swap the positions of the two parent elements
      const parentA = element;

      if (!draggedElement) return;

      const parentB = draggedElement.parentNode;
      const childA = parentA.firstElementChild;

      // Swap the order of the parent elements
      parentA.insertBefore(parentB.firstElementChild, parentA.firstElementChild);
      parentB.insertBefore(childA, parentB.firstElementChild);
      
      element.classList.remove("document-editable-hover-drop");
    });
  });
}


/**
 * Wrap all HTML elements inside the index.html "document-editable" container
 * @return {void} 
 */ 
function makeAllElementsEditable() {
  const doc = document.getElementById('document-doc');

  for (let i = 0; i < doc.children.length; i++) {
    let element = doc.children[i];
    
    if (element.classList.contains('document-editable') || element.classList.contains('page')) continue;

    const container = document.createElement('div');
    container.classList.add('document-editable');
    container.dataset.id = ElementID++;

    element.replaceWith(container);
    container.appendChild(element);

    const dragHandel = document.createElement('div');
    dragHandel.classList.add('document-drag-handel')
    dragHandel.setAttribute('draggable', true);
  
    dragHandel.innerHTML = '=';

    container.appendChild(dragHandel);
  }
  let today = new Date();
  let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  const fileChangedTime  = document.getElementById('settings-info-file-changed-value');
  fileChangedTime.innerHTML = date;
  stateManager.pushState(doc.innerHTML);
}


/**
 * Add drag and dropping to the index.html
 * @return {void} 
 */ 
function enableDragAndDropFiles(){
  let dropZone = document.getElementById('document-file-dropzone');

  // Check if a file is dragged into window
  window.addEventListener('dragenter', function (e) {
      if (e.dataTransfer.types && e.dataTransfer.types.every( (element) => element == 'Files') && e.dataTransfer.types.length != 0) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    }
  });

  // Check if a file is dragged out of the now activated DropZone 
  dropZone.addEventListener('dragleave', function (e) {
      dropZone.classList.remove('drag-over');

  });

  // Drag over and drop event if file is carried and released
  dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
  });

  dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      let files = e.dataTransfer.files;
      handleFiles(files);
  });
}

// Functions which handles the files and their content //
// TO-DO: now it only uses the last file !
function handleFiles(files) {
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    let fileName = file.name.toLowerCase();
    let fileType = file.type.toLowerCase();

      // Check if Files are Markdown Files
      if (fileName.endsWith('.md') || fileType === 'text/markdown') {

        // Delete all other elements
        let allElements = document.querySelectorAll('.document-editable');
        let metadata = document.getElementById('settings-meta');
        const fileChangeTime  = document.getElementById('settings-info-file-changed-value');
        const fileCreateTime  = document.getElementById('settings-info-file-created-value');
        let filename = document.getElementById('settings-meta-filename');

        for (let child of allElements) {
          child.remove();
        }
        
        addNewTextarea(null, true);
        
        // Insert the file content into the textarea
        filename.value = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        var pastDay = new Date(file.lastModified);
        let date = pastDay.getFullYear()+'-'+(pastDay.getMonth()+1)+'-'+pastDay.getDate()+' '+ pastDay.getHours() + ":" + pastDay.getMinutes() + ":" + pastDay.getSeconds();
        fileChangeTime.innerHTML = date;
        fileCreateTime.innerHTML = 'not accessible'
        
        let newTextfield = document.getElementById('document-textarea'); 
        let reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = function (evt) {
          let match = evt.target.result.match(/^(?:\-\-\-)(.*?)(?:\-\-\-|\.\.\.)/s)
          metadata.value = match ? match[0] : null;
          
          newTextfield.value = evt.target.result.replace(/^(?:\-\-\-)(.*?)(?:\-\-\-|\.\.\.)/s,'');
          newTextfield.blur();
        }
        reader.onerror = function (evt) {
          console.log('Error: Reading the file:', fileName);
        }
      } else {
          console.log('Error: Unsupported file type:', fileName);
    }
  }
}

/**
 * Load last file
 * @return {void} 
 */ 
function loadLastFile() {
  const doc = document.getElementById('document-doc');

  while (doc.firstChild) doc.firstChild.remove();

  doc.innerHTML = localStorage.getItem("documentText");
}

/**
 * Load example file
 * @return {void} 
 */ 
function loadExample() {
  var client = new XMLHttpRequest();
  client.open('GET', '/md/markdown-sample.md');
  client.onreadystatechange = function() {
    if (client.readyState === 4 && client.status === 200) {
      // Delete all other elements
      let metadata = document.getElementById('settings-meta');
      let allElements = document.querySelectorAll('.document-editable');
      const fileCreateTime  = document.getElementById('settings-info-file-created-value');

      for (let child of allElements) {
        child.remove();
      }

      addNewTextarea(null, true);

      let newTextfield = document.getElementById('document-textarea');
      let match = client.responseText.match(/^(?:\-\-\-)(.*?)(?:\-\-\-|\.\.\.)/s);
      metadata.value = match ? match[0] : null;

      newTextfield.value = client.responseText.replace(/^(?:\-\-\-)(.*?)(?:\-\-\-|\.\.\.)/s,'');
      newTextfield.blur();
    }
  }
  client.send();
}

/**
 * Add Event Listeners to all Context-Menu Buttons
 * @return {void} 
 */ 
function addEventListenersToContextMenu() {
  
  let addBtn = document.getElementById('context-menu-button-end');
  addBtn.addEventListener('click', function (e) {
    if(document.getElementById('document-doc').hasChildNodes())
      addNewTextarea(document.getElementById('document-doc').lastChild, false);
    else
      addNewTextarea(null, true);
  });
  
  let aboveBtn = document.getElementById('context-menu-button-above');
  aboveBtn.addEventListener('click', function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    addNewTextarea(clickedElement, true);
    removeSelection();
  });
  
  let belowBtn = document.getElementById('context-menu-button-below');
  belowBtn.addEventListener('click', function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    addNewTextarea(clickedElement,false);
    removeSelection();
  });

  let clearFormattingBtn = document.getElementById('contextMenu-clearFormatting');
  clearFormattingBtn.addEventListener('click', async function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    await replaceElementWithTextarea(clickedElement,false);
    let focusedTextarea = document.getElementById('document-textarea');
    if (!focusedTextarea) return;

    let selectedText = focusedTextarea.value;
    let modifiedText = selectedText.replace(/\[\]|\[x\]|!|\~|\*{1,2}|\>|\[|\]|\(|\)|\_|\#+\s*|```|`/g, '');
    focusedTextarea.value = modifiedText;
    focusedTextarea.blur();
    removeSelection();
  });

  let alignLeftBtn = document.getElementById('contextMenu-alignLeft');
  alignLeftBtn.addEventListener('click', function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    clickedElement.firstChild.removeAttribute('style');
  });

  let alignCenterBtn = document.getElementById('contextMenu-alignCenter');
  alignCenterBtn.addEventListener('click', function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    clickedElement.firstChild.style.textAlign = 'center';
  });

  let alignRightBtn = document.getElementById('contextMenu-alignRight');
  alignRightBtn.addEventListener('click', function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    clickedElement.firstChild.style.textAlign = 'right';
  });

  let alignJustifyBtn = document.getElementById('contextMenu-alignJustify');
  alignJustifyBtn.addEventListener('click', function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    clickedElement.firstChild.style.textAlign = 'justify';
  });


  let deleteBtn = document.getElementById('contextMenu-delete');
  deleteBtn.addEventListener('click', async function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    await replaceElementWithTextarea(clickedElement,false);
    let focusedTextarea = document.getElementById('document-textarea');
    focusedTextarea.value = '';
    focusedTextarea.blur();
    removeSelection();
  });

  
  let quoteBtn = document.getElementById('contextMenu-quote');
  quoteBtn.addEventListener('click', async function (e) {
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;
    await replaceElementWithTextarea(clickedElement,false);
    let focusedTextarea = document.getElementById('document-textarea');

    if (!focusedTextarea) return;

    let text = focusedTextarea.value;
    let selectionStart = focusedTextarea.selectionStart;
    let selectionEnd = focusedTextarea.selectionEnd;

    let startOfLine = text.lastIndexOf('\n', selectionStart - 1) + 1;
    let endOfLine = text.indexOf('\n', selectionEnd);

    if (startOfLine === -1) {
        startOfLine = 0;
    }

    if (endOfLine === -1) {
        endOfLine = text.length;
    }

    let selectedText = text.substring(startOfLine, endOfLine);
    let modifiedText = '';

    modifiedText = text.substring(0, startOfLine) + "> " + selectedText + text.substring(endOfLine);

    focusedTextarea.value = modifiedText;

    // Set the cursor position back to its original location
    focusedTextarea.setSelectionRange(selectionStart+2, selectionEnd + (modifiedText.length - text.length));
    focusedTextarea.blur();
    removeSelection();
  });

  let codeBtn = document.getElementById('contextMenu-code');
  codeBtn.addEventListener('click', async function (e) {
    
    documentElement = document.getElementById('document-doc');
    let clickedElement = documentElement.querySelector('.document-editable-selected');
    if (!clickedElement) return;

    await replaceElementWithTextarea(clickedElement,false);
    let focusedTextarea = document.getElementById('document-textarea');

    if (!focusedTextarea) return;

    let text = focusedTextarea.value;
    let modifiedText = text;

    if (text.startsWith('```') && text.endsWith('```')) {
        modifiedText = modifiedText.slice(4);
        modifiedText = modifiedText.slice(0, -4);

    } else modifiedText = "```" + "\r" + text + "\r" + "```";
    

    focusedTextarea.style.height = "0px";
    focusedTextarea.value = modifiedText;
    focusedTextarea.style.height = focusedTextarea.scrollHeight + "px";
    focusedTextarea.blur();
    removeSelection();
  });
}


/**
 * getting a list of all HTML Elements inside the "document-editable" Elements
 * @return {Array<HTMLElement>} 
 */ 
function getDocumentElements() {
  const doc = document.getElementById('document-doc');

  let docElements = [];

  for(let i = 0; i < doc.children.length; i++) {
      const firstElementChild = doc.children[i].firstElementChild;
      if(firstElementChild !== null)
        docElements.push(firstElementChild);
  }

  return docElements;
}




/**
 * Auto save current file
 * @return {void} 
 */ 
function autoSaveDocument() {
  const metadata = document.getElementById('settings-meta');
  const doc = document.getElementById('document-doc');
  let documentText = "";
  documentText += metadata.outerHTML.replace(/(<textarea name="" id="settings-meta".*>)(<\/textarea>)/s, '$1' + metadata.value + '$2') + "\n";
  for(let i = 0; i < doc.children.length; i++) {
      const firstElementChild = doc.children[i].firstElementChild;
      if(firstElementChild !== null)
          documentText += firstElementChild.outerHTML + "\n";
  }

  localStorage.setItem('autoSave', documentText);
}

/**
 * Load auto save file
 * @return {void} 
 */ 
function loadAutoSave() {
  if(!localStorage.getItem('autoSave')) return false;

  if (confirm("An auto save exists, do you wanna load it?")) {
    const doc = document.getElementById('document-doc');
    let metadata = document.getElementById('settings-meta');
    while (doc.firstChild) doc.firstChild.remove();

    let html = localStorage.getItem("autoSave");

    let match = html.match(/<textarea name="" id="settings-meta".*>(.*)<\/textarea>/s)
    metadata.value = match ? match[1] : null;
    html = html.replace(/<textarea name="" id="settings-meta".*>.*<\/textarea>/s,'');


    doc.innerHTML = html; 
    
    showPopup("loaded Autosave");
    return true;
  } else {
    localStorage.removeItem("autoSave");
    return false;
  }
}


const emptyDocumentAddLine = document.getElementById('empty-document-add-line');

function showEmptyLineContainer() {
  if (!document.getElementById('document-doc').hasChildNodes()) emptyDocumentAddLine.style.display = "flex";
  document.getElementById('empty-document-add-line-input').focus();
}



emptyDocumentAddLine.addEventListener('click', event => {
  addNewTextarea(null, true);
  emptyDocumentAddLine.style.display = "none";
});

document.getElementById('empty-document-add-line-input').addEventListener('keydown', event => {
  addNewTextarea(null, true);
  emptyDocumentAddLine.style.display = "none";
});

