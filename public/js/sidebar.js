// Menu Buttons
const menuBtn = document.getElementById('sidebar-menu');
const sidebar = document.getElementById('sidebar-dropdown');

const newBtn = document.getElementById('sidebar-new');
const openBtn = document.getElementById('sidebar-open');
const saveBtn = document.getElementById('sidebar-save');

const exportHTMLBtn = document.getElementById('sidebar-export-html');
const exportMarkdownBtn = document.getElementById('sidebar-export-markdown');

const printBtn = document.getElementById('sidebar-print');

const menuSettingsBtn = document.getElementById('sidebar-menu-settings');

// Sidebar Buttons
const undoBtn = document.getElementById('sidebar-undo').parentNode;
const redoBtn = document.getElementById('sidebar-redo').parentNode;

const boldBtn = document.getElementById('sidebar-bold').parentNode;
const italicBtn = document.getElementById('sidebar-italic').parentNode;
const headingBtn = document.getElementById('sidebar-heading').parentNode;
const strikethroughBtn = document.getElementById('sidebar-strikethrough').parentNode;
const codeBtn = document.getElementById('sidebar-code').parentNode;
const clearFormattingBtn = document.getElementById('sidebar-clearFormatting').parentNode;

const unorderedListBtn = document.getElementById('sidebar-unorderedList').parentNode;
const orderedListBtn = document.getElementById('sidebar-orderedList').parentNode;
const checkListBtn = document.getElementById('sidebar-checkList').parentNode;

const quoteBtn = document.getElementById('sidebar-quote').parentNode;
const codeBlockBtn = document.getElementById('sidebar-codeBlock').parentNode;
const tableBtn = document.getElementById('sidebar-table').parentNode;
const imageBtn = document.getElementById('sidebar-image').parentNode;
const linkBtn = document.getElementById('sidebar-link').parentNode;

const html = document.getElementsByTagName("html")[0];
const darkmodeBtn = document.getElementById('sidebar-darkmode').parentNode;
const darkmodeOn = "imgs/icons/moon-line.svg";
const darkmodeOff = 'imgs/icons/moon-fill.svg';

const settingsBtn = document.getElementById('sidebar-settings').parentNode;
const settingsMenu = document.getElementById('settings-menu'); 
const settingsCloseBtn = document.getElementById('settings-close'); 

const newFormattingBtn = document.getElementById('sidebar-newFormatting').parentNode; 

// Popup
const popup = document.getElementById('popup');

var toolbarScale = 1;

/**
 * Scaling the sidebar with ctrl + mousewheel
 * @param {String} type
 * @param {event} event
 * @return {void} 
 */
document.getElementById('sidebar').addEventListener('wheel', event => {
    event.preventDefault();
    if (event.ctrlKey) {

        
        toolbarScale += event.deltaY > 0 ? -0.1 : 0.1; // Adjust scale factor based on scroll direction
        
        if (toolbarScale < 0.8) toolbarScale = 0.8;
        if (toolbarScale > 1.4) toolbarScale = 1.4;

        settingsDisplaySidebarZoom.value = toolbarScale;

        document.getElementById('sidebar-list').style.transformOrigin = 'top';
        document.getElementById('sidebar-list').style.transform = `scale(${toolbarScale})`;

        UpdateSettings();
    }
});


// Menu

/**
 * Open up the menu
 * @param {String} type
 * @param {event} event
 * @return {void} 
 */
menuBtn.addEventListener('click', event => {
    sidebar.style.display = sidebar.style.display == 'none' ? 'block' : 'none';
});

document.addEventListener('click', event => {
    const isClickInsideMenu = sidebar.contains(event.target);
    const isClickOnMenuBtn = event.target === menuBtn;

    if (!isClickInsideMenu && !isClickOnMenuBtn)
        sidebar.style.display = 'none';
    
});

newBtn.addEventListener('click', event => {
    let filename = document.getElementById('settings-meta-filename');
    let metadata = document.getElementById('settings-meta');
    const fileCreateTime  = document.getElementById('settings-info-file-created-value');
    const doc = document.getElementById('document-doc');
    
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    fileCreateTime.innerHTML = date;

    filename.value = '';
    metadata.value = '';

    while (doc.firstChild)
        doc.firstChild.remove();

    showEmptyLineContainer();

    showPopup("New File Created");
});


openBtn.addEventListener('click', event => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.md';

    fileInput.addEventListener('change', event => {
        var files = event.target.files;
        handleFiles(files);
    });

    fileInput.click();
});

saveBtn.addEventListener('click', event => {
    const doc = document.getElementById('document-doc');

    let documentText = "";

    for(let i = 0; i < doc.children.length; i++) {
        const firstElementChild = doc.children[i].firstElementChild;
        if(firstElementChild !== null)
            documentText += firstElementChild.outerHTML + "\n";
    }

    localStorage.setItem('documentText', documentText);
    showPopup("Document Saved to the browser");
});


printBtn.addEventListener('click', event => {
    print();
});


// Export
exportHTMLBtn.addEventListener('click', event => {
    const filename = document.getElementById('settings-meta-filename');
    let docElements = getDocumentElements();

    const htmlString = generateHTMLString(docElements);
    if(filename.value == '')
    downloadFile(htmlString, 'text/html', docElements[0].innerText + '.html');
    else
    downloadFile(htmlString, 'text/html', filename.value + '.html');
    showPopup("Document exported as HTML");
});

/**
 * Generate a HTML String for the elements
 * @param {HTMLElement} elements
 * @return {string} 
 */
function generateHTMLString(elements) {
    let htmlString = '<!DOCTYPE html>\n<html>\n<head>\n<title>Exported Document</title>\n</head>\n<body>\n';

    elements.forEach(element => {
        htmlString += element.outerHTML + '\n';
    });

    htmlString += '</body>\n</html>';
    
    return htmlString;
}

exportMarkdownBtn.addEventListener('click', event => {
    const filename = document.getElementById('settings-meta-filename');
    const metadata = document.getElementById('settings-meta');
    const doc = document.getElementById('document-doc');

    let docElements = [];

    let metadataPara = document.createElement('p');
    metadataPara.textContent = metadata.value;
    metadataPara.innerHTML = metadataPara.innerHTML.replace(/\n/g, '<br>\n');

    docElements.push(metadataPara);

    for(let i = 0; i < doc.children.length; i++) {
        const firstElementChild = doc.children[i].firstElementChild;
        if(firstElementChild !== null) {
             docElements.push(firstElementChild);
        }
    }

    generateMarkdownString(docElements).then(markdownString => {
        if(filename.value == '')
        downloadFile(markdownString, 'text/markdown', docElements[1].innerText + '.md');
        else
        downloadFile(markdownString, 'text/markdown', filename.value + '.md');
    });

    showPopup("Document exported as markdown");
});


/**
 * Generate a Markdown String for the elements
 * @param {HTMLElement} elements
 * @return {string} 
 */
function generateMarkdownString(elements) {
    const markdownPromises = elements.map(async element => {
        return await convertHTMLtoMarkdown(element.outerHTML);
    });

    return Promise.all(markdownPromises).then(markdownArray => markdownArray.join('\n\n'));
}

/**
 * Download the current file
 * @param {string} htmlString
 * @param {string} fileType
 * @param {string} fileName
 * @return {void} 
 */
function downloadFile(htmlString, fileType, fileName) {
    const blob = new Blob([htmlString], { type: fileType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}


// Undo/Redo
/**
 * Update the content of the document
 * @param {string} content
 * @return {void} 
 */
function updateDocContent(content) {
    let doc = document.getElementById('document-doc');
    doc.innerHTML = content;
}

undoBtn.addEventListener('click', event => {
    const previousState = stateManager.undo();
    if (previousState !== null) {
        updateDocContent(previousState);
    }
});

redoBtn.addEventListener('click', event => {
    const nextState = stateManager.redo();
    if (nextState !== null) {
        updateDocContent(nextState);
    }
});


// Text Style
boldBtn.addEventListener('click', async event => {
    toggleWord(String.raw`\*\*\$1\*\*`);
});

italicBtn.addEventListener('click', event => {
    toggleWord(String.raw`\*\$1\*`);
});


headingBtn.addEventListener('click', event => {
    let focusedTextarea = document.getElementById('document-textarea');

    if (!focusedTextarea) return;

    let selectedText = focusedTextarea.value;
    let headingLevel = selectedText.match(/^#{1,6}/);

    headingLevel = headingLevel ? headingLevel[0].length : 0;
    headingLevel = Math.min(headingLevel + 1, 7);

    let textWithoutHashes = selectedText.replace(/^#{1,6}\s*/, '');

    let newText = textWithoutHashes;
    if (headingLevel <= 6)
        newText = '#'.repeat(headingLevel) + ' ' + textWithoutHashes;
 
    focusedTextarea.value = newText;
});

strikethroughBtn.addEventListener('click', event => {
    toggleWord(String.raw`\~\~\$1\~\~`);
});

codeBtn.addEventListener('click', event => {
    toggleWord( String.raw`\`\$1\``);
});

clearFormattingBtn.addEventListener('click', event => {
    let focusedTextarea = document.getElementById('document-textarea');

    if (!focusedTextarea) return;

    let selectedText = focusedTextarea.value.substring(focusedTextarea.selectionStart, focusedTextarea.selectionEnd);
    let modifiedText = selectedText.replace(/\[\]|\[x\]|!|\~|\*{1,2}|\>|\[|\]|\(|\)|\_|\#+\s*|```|`/g, '');
    focusedTextarea.setRangeText(modifiedText);
});

// List presets
// TO-DO: Refine the getCurrentWord() function to include the special characters for lists
unorderedListBtn.addEventListener('click', event => {
    toggleWord(String.raw`\n\n\*   \$1\n`);
});

orderedListBtn.addEventListener('click', event => {
    toggleWord(String.raw`\n\n1\.   \$1\n`);
});

checkListBtn.addEventListener('click', event => {
    toggleWord(String.raw`\n\n\*   \[ \]  \$1\n`);
});

// Special formatting presets
codeBlockBtn.addEventListener('click', event => {
    toggleWord(String.raw`\n\`\`\`\n\$1\n\`\`\`\n`);
});

// Derived from  https://stackoverflow.com/questions/59160006/creating-a-control-like-microsoft-office-words-table-generator-in-html
tableBtn.addEventListener('click', async event => {
    let focusedTextarea = document.getElementById('document-textarea');

    if (!focusedTextarea) return;

    let tablepicker = document.getElementById('table-picker');
    tablepicker.style.visibility = "visible"
    tablepicker.style.left = "2.5rem"
    tablepicker.style.top = event.clientY + "px"

    tablepicker.onclick = (e) => {
        let col = tablepicker.children[0].x
        let row =tablepicker.children[0].y

        let newTable ="\n"

        for(i = 0; i < col; i++){
            newTable += "|     ";
        }
        newTable += "|\n";

        for(i = 0; i < col; i++){
            newTable += "| --- ";
        }
        newTable += "|\n";

        for(j = 2; j < row+1; j++){
            for(i = 0; i < col; i++){
            newTable += "|     ";
            }
            newTable += "|\n";
        }
        newTable += "\n";
        focusedTextarea.setRangeText(newTable);
        tablepicker.style.visibility = "hidden"
        focusedTextarea.style.height = 'auto';
        focusedTextarea.style.height = (focusedTextarea.scrollHeight) + 'px';
    };

    tablepicker.onmouseover = (e) => {
        if (e.target.tagName !== "TD") return;
        let td = e.target;
        let tr = td.parentNode;
        let table = tr.parentNode;
        // Calculate colCount and ensure it's at least 2
        let colCount = Math.max(td.cellIndex + 1, 2);

        // Calculate rowCount and ensure it's at least 2
        let rowCount = Math.max(tr.rowIndex + 1, 2);
        for (let i = 0; i < table.rows.length; i++) {
            let row = table.rows[i];
            let inside = row.rowIndex < rowCount;
            for (let j = 0; j < row.cells.length; j++) {
                let cell = row.cells[j];
                cell.classList.toggle("tablehighlight", inside && cell.cellIndex < colCount);
            }
        }
        tablepicker.children[0].textContent = `${colCount}x${rowCount} Table`;
        tablepicker.children[0].x = colCount
        tablepicker.children[0].y = rowCount
        return false;
    };

    tablepicker.onmouseleave = (e) => {
        tablepicker.style.visibility = "hidden"
    };

});

quoteBtn.addEventListener('click', event => {
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
});

imageBtn.addEventListener('click', event => {
    toggleWord(String.raw`\!\[\$1\]\(.*?\)`);
});

linkBtn.addEventListener('click', event => {
    toggleWord(String.raw`\[\$1\]\(.*?\)`);
});

// Darkmode
darkmodeBtn.addEventListener('click', event => {
    let darkmode = html.dataset.theme == "dark";

    if (darkmode) {
        html.dataset.theme = "";
        darkmodeBtn.firstElementChild.src = darkmodeOn;
        settingsDisplayDarkmode.checked = false;
    }
    else {
        html.dataset.theme = "dark";
        darkmodeBtn.firstElementChild.src = darkmodeOff;
        settingsDisplayDarkmode.checked = true;
    } 

    UpdateSettings();
});



// SETTINGS

settingsBtn.addEventListener('click', toggleSettingsMenu);
settingsCloseBtn.addEventListener('click', toggleSettingsMenu);
menuSettingsBtn.addEventListener('click', toggleSettingsMenu);

/**
 * Show the settings menu
 * @return {void} 
 */
function toggleSettingsMenu() {
    settingsMenu.style.display = (settingsMenu.style.display == "none") ? "block" : "none";
}

const tabs = document.querySelectorAll('#settings-categories li');
const contentDivs = document.querySelectorAll('#settings-content div');
const sidebarDivs = document.querySelectorAll('#settings-sidebar div')

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const contentId = tab.getAttribute('data-content');
    
    tabs.forEach(tab => tab.classList.remove('settings-active-category'));
    
    tab.classList.add('settings-active-category');
    
    contentDivs.forEach(div => div.classList.remove('settings-active'));
    document.getElementById(contentId).classList.add('settings-active');
    
    

    sidebarDivs.forEach(div => div.classList.remove('settings-active-sidebar'));
    let sidebarID = contentId + "-sidebar";
    if (document.getElementById(sidebarID)) document.getElementById(sidebarID).classList.add('settings-active-sidebar');

  });
});

/**
 * Toggle the settings options based on the id
 * @param {string} id
 * @return {void} 
 */
function toggleSettingsOptions(id) {
    var options = document.getElementById(id);
    options.classList.toggle('settings-sub-options-active');
}




// Snippets
newFormattingBtn.addEventListener('click', () => {
    toggleSettingsMenu();
    tabs.forEach(tab => tab.classList.remove('settings-active-category'));
    contentDivs.forEach(div => div.classList.remove('settings-active'));


    document.getElementById('settings-snippets').classList.add('settings-active');
    document.getElementById('settings-category-snippets').classList.add('settings-active-category');
});



// Stay focus on a text if you click something in the sidebar
document.getElementById('sidebar').addEventListener('mousedown', function (e) {
    // Prevent the default behavior of the click event
    e.preventDefault();
});

/**
 * Get the current word of the curser selected
 * @return {String} 
 */
function getCurrentWord() {
    let textarea = document.getElementById('document-textarea');
    let cursorPosition = textarea.selectionStart;
    let textBeforeCursor = textarea.value.substring(0, cursorPosition);
    let textAfterCursor = textarea.value.substring(cursorPosition);

    let wordsBeforeCursor = textBeforeCursor.split(" ");
    let wordBeforCursor = wordsBeforeCursor[wordsBeforeCursor.length - 1];

    let wordAfterCursor = textAfterCursor.split(" ")[0];

    let currentWord = {
        string: wordBeforCursor + wordAfterCursor,
        from: cursorPosition - wordBeforCursor.length,
        to: cursorPosition + wordAfterCursor.length,
    };

    return currentWord;
}

/**
 * Show a popup with a message
 * @param {string} string
 * @param {boolean} dark
 * @return {void} 
 */
function showPopup(string, dark = true) {
    clearTimeout(hidePopup);
    popup.innerHTML = string;
    popup.classList.remove('popup-hide');
    popup.classList.add('popup-show');

    if (dark) {
        popup.style.background = '';
        popup.style.color = '';
    } else {
        popup.style.background = 'white';
        popup.style.color = 'black';
    }

    setTimeout(hidePopup, 2000);
}

/**
 * Hide the popups
 * @return {void} 
 */
function hidePopup() {
    popup.classList.remove('popup-show');
    popup.classList.add('popup-hide');
}


/**
 * Toggle the selected word to the regex
 * @param {String} regex
 * @return {void} 
 */
async function toggleWord(regex) {
    const focusedTextarea = document.getElementById('document-textarea');

    if (!focusedTextarea) return;

    let selectedFrom = focusedTextarea.selectionStart;
    let selectedTo = focusedTextarea.selectionEnd;

    let inputString = focusedTextarea.value.substring(selectedFrom, selectedTo);
    let outputString = "";

    if (selectedFrom == selectedTo) {
        const currentWordObj = getCurrentWord();

        inputString = currentWordObj.string;
        selectedFrom = currentWordObj.from;
        selectedTo = currentWordObj.to;
    }

    outputString = await toggleMarkdownSyntax(inputString, regex);
    focusedTextarea.setRangeText(outputString , selectedFrom, selectedTo);
    
    focusedTextarea.style.height = 'auto';
    focusedTextarea.style.height = (focusedTextarea.scrollHeight) + 'px';

    async function toggleMarkdownSyntax(inputString, regex) {

        const generatedString = await generateStringFromRegex(regex)
        const convertRegex = convertReplaceRegexPattern(regex);
        const isMatching = inputString.match(convertRegex);

        if (isMatching) {
            // Construct a string with $d repeated count times based on the number of $1 in regex
            const matches = regex.match(/\$1/g);
            const count = matches ? matches.length : 0;
            let newString = '';
            for (let i = 0; i < count; i++) {
                newString += '$' + (i + 1);
            }
            return inputString.replace(convertRegex, newString);
        }
        else 
        // Replaces the $1 with the markedtext and the other $2,$3,$4...  with blanks '' 
        return inputString.replace(/^(.*)$/gm, generatedString)
    }

    function convertReplaceRegexPattern(replacementString) {
        // Replace $1 with (.*?) and the other $2,$3,$4... with .*
        const regexPattern = replacementString.replace(/\\\$1/g, '(.*?)').replace(/\\\$\d/g, '.*?');
        return new RegExp(regexPattern, 'gm');
    }
}

/**
 * Function to generate random String from RegEx
 * @param {string} regex
 * @return {RegExp} 
 */
async function generateStringFromRegex(regex) {
    try {
      const response = await fetch('/generateString', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ regex: regex })
      });
      return await response.text();
    } catch (error) {
      throw error;
    }
}