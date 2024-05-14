// File
    // File Options
const settingsNewButton = document.getElementById('settings-new-file');
const settingsOpenFile  = document.getElementById('settings-open-file');
const settingsSaveFile  = document.getElementById('settings-save-file');
const settingsExportHtml  = document.getElementById('settings-export-html');
const settingsExportMarkdown  = document.getElementById('settings-export-markdown');
const settingsPrintFile  = document.getElementById('settings-print-file');
    // Metadata
const settingsMetaFileName = document.getElementById('settings-meta-file-name');
const settingsMetaAuthor = document.getElementById('settings-meta-file-author');
const settingsMetaKeywords = document.getElementById('settings-meta-file-keywords');
const settingsMetaAbstracr = document.getElementById('settings-meta-file-abstract');


// File Info
const settingsInfoLines = document.getElementById('settings-info-lines');
const settingsInfoCharacters = document.getElementById('settings-info-characters');
const settingsInfoCreated = document.getElementById('settings-info-file-created');
const settingsInfoChanged = document.getElementById('settings-info-file-changed');


// Display
    // General
const settingsDisplayDarkmode = document.getElementById('settings-display-darkmode');
const settingsDisplayDocumentZoom = document.getElementById('settings-display-document-zoom');
    // Font
const settingsDisplayFontFontstyle = document.getElementById('settings-font-font');
const settingsDisplayFontSize = document.getElementById('settings-font-size');
// Sidebar
const settingsDisplaySidebarZoom = document.getElementById('settings-sidebar-zoom');


// Reset
const settingsReset = document.getElementById('settings-reset');


// Contact
const settingsContactSendMail = document.getElementById('settings-contact-send-mail');



// Snippets
const settingsSnippetsSnippetName = document.getElementById('settings-snippets-snippet-name');
const settingsSnippetsSnippetIcon = document.getElementById('settings-snippets-snippet-icon');
const settingsSnippetsSnippetRegex = document.getElementById('settings-snippets-snippet-regex');
const settingsSnippetsSnippetHtml = document.getElementById('settings-snippets-snippet-html');
const settingsSnippetsSnippetRegexHtml = document.getElementById('settings-snippets-snippet-html-advanced');
const settingsSnippetsSnippetMarkdown = document.getElementById('settings-snippets-snippet-regex-advanced');

const settingsSnippetsExportSnippets = document.getElementById('settings-snippets-export-snippets');
const settingsSnippetsImportSnippets = document.getElementById('settings-snippets-import-snippets');
const settingsSnippetsSaveSnippets = document.getElementById('settings-snippets-save-snippets');
const settingsSnippetsDelteSnippets = document.getElementById('settings-snippets-delete-snippets');

const settingsSnippetsSidebar = document.getElementById('settings-snippets-sidebar');
const settingsSnippetsAddSnippet = document.getElementById('settings-snippets-sidebar-add-button');

let settingsSnippetsPreview = document.getElementById('settings-preview-window');
let settingsSnippetsPreviewContainer = document.getElementById('settings-preview-window-container');

// Saving Settings

let UserSettings = {
    darkmode: true,
    documentZoom: 100,
    font: "Cousine",
    fontSize: 16,
    sidebarZoom: 1,
}

const DefaultSettings = {
    darkmode: true,
    documentZoom: 100,
    font: "Cousine",
    fontSize: 16,
    sidebarZoom: 1,
}



function saveSettings() {
    const jsonString = JSON.stringify(UserSettings);
    localStorage.setItem('settings', jsonString);
}


function LoadSettings() {
    if(localStorage.getItem('settings')) {
        const savedJSONstring = localStorage.getItem('settings');
        UserSettings = JSON.parse(savedJSONstring);
    }

    updateDisplayDarkmode(UserSettings.darkmode);
    updateDisplayDocumentZoom(UserSettings.documentZoom);

    updateDisplayFontsize(UserSettings.fontSize);
    updateDiaplyFontFontstyle(UserSettings.font);
    
    updateDisplaySidebarZoom(UserSettings.sidebarZoom);
}

function UpdateSettings() {
    UserSettings = {
        darkmode: settingsDisplayDarkmode.checked,
        documentZoom: settingsDisplayDocumentZoom.value,
        font: settingsDisplayFontFontstyle.value,
        fontSize: settingsDisplayFontSize.value,
        sidebarZoom: parseFloat(settingsDisplaySidebarZoom.value),
    };

    saveSettings();
}



// File Functionality
settingsNewButton.addEventListener('click', event => {
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

    showPopup("New File Created", false);
});

settingsOpenFile.addEventListener('click', event => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.md';

    fileInput.addEventListener('change', event => {
        var files = event.target.files;
        handleFiles(files);
    });

    fileInput.click();
});

settingsSaveFile.addEventListener('click', event => {
    const doc = document.getElementById('document-doc');

    let documentText = "";

    for(let i = 0; i < doc.children.length; i++) {
        const firstElementChild = doc.children[i].firstElementChild;
        if(firstElementChild !== null)
            documentText += firstElementChild.outerHTML + "\n";
    }

    localStorage.setItem('documentText', documentText);
    showPopup("Document Saved to the browser", false);
});

settingsExportHtml.addEventListener('click', event => {
    const filename = document.getElementById('settings-meta-filename');
    let docElements = getDocumentElements();

    const htmlString = generateHTMLString(docElements);
    if(filename.value == '')
    downloadFile(htmlString, 'text/html', docElements[0].innerText + '.html');
    else
    downloadFile(htmlString, 'text/html', filename.value + '.html');
    showPopup("Document exported as HTML", false);
});

settingsExportMarkdown.addEventListener('click', event => {
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

    showPopup("Document exported as markdown", false);
});

settingsPrintFile.addEventListener('click', event => {
    print();
});

// File Info



// Display
function updateDisplayDarkmode(value) {
    settingsDisplayDarkmode.checked = value;
    if(!value) {
        html.dataset.theme = "";
        darkmodeBtn.firstElementChild.src = darkmodeOn;
    } else {
        html.dataset.theme = "dark";
        darkmodeBtn.firstElementChild.src = darkmodeOff;
    }
}

settingsDisplayDarkmode.addEventListener('click', event => {
    updateDisplayDarkmode(settingsDisplayDarkmode.checked);
    UpdateSettings();
});


function updateDisplayDocumentZoom(value) {
    const zoomSlider = document.getElementById("zoom-slider");
    const zoomValue = document.getElementById("zoom-value");
    const zoomContainer = document.getElementById("zoom-container");

    settingsDisplayDocumentZoom.value = value;
    zoomSlider.value = value;
    const zoomLevel = zoomSlider.value;
    
    zoomValue.textContent = zoomLevel + "%";

    // Calculate the translation to keep the container centered
    const containerWidth = zoomContainer.offsetWidth;
    const containerHeight = zoomContainer.offsetHeight;
    const translateX = (containerWidth * (1 - zoomLevel / 100)) / 2;


    // Apply translation and scaling in one transform
    if (zoomLevel / 100 < 1) {
        zoomContainer.style.transform = `translate(${translateX}px) scale(${zoomLevel / 100})`;
    } else {
        zoomContainer.style.transform = `scale(${zoomLevel / 100})`;
    }
}

settingsDisplayDocumentZoom.addEventListener('input', event => {
    updateDisplayDocumentZoom(settingsDisplayDocumentZoom.value);
    UpdateSettings();
});


function updateDiaplyFontFontstyle(value) {
    settingsDisplayFontFontstyle.value = value;

    if (value == "Cousine") {
        document.body.style.fontFamily = "Cousine, monospace";
    } else if (value == "Monospace") {
        document.body.style.fontFamily = "monospace";
    } else if (value == "Arial") {
        document.body.style.fontFamily = "Arial, Helvetica, sans-serif";
    } else {
        document.body.style.fontFamily = "Cousine, monospace";
    }
}

settingsDisplayFontFontstyle.addEventListener('input', event => {
    updateDiaplyFontFontstyle(settingsDisplayFontFontstyle.value);
    UpdateSettings();
});


function updateDisplayFontsize(value) {
    settingsDisplayFontSize.value = value;
    document.getElementById('document-doc').style.fontSize = value + "px";
}

settingsDisplayFontSize.addEventListener('input', event => {
    updateDisplayFontsize(settingsDisplayFontSize.value);
    UpdateSettings();

});



function updateDisplaySidebarZoom(value) {
    settingsDisplaySidebarZoom.value = value;
    document.getElementById('sidebar-list').style.transformOrigin = 'top';
    document.getElementById('sidebar-list').style.transform = `scale(${value})`;
}

settingsDisplaySidebarZoom.addEventListener('input', event => {
    updateDisplaySidebarZoom(parseFloat(settingsDisplaySidebarZoom.value));
    UpdateSettings();
});


// Reset Settings
settingsReset.addEventListener('click', event => {
    UserSettings = DefaultSettings;
    saveSettings();
    LoadSettings();
});




// Snippets
function loadSnippetCards() {
    const snippetContainer = document.getElementById('settings-snippets-snippet-list');

    while (snippetContainer.firstChild)
        snippetContainer.firstChild.remove();


    customPlugins.forEach(snippet => {
        const snippetCard = document.createElement('div');
        snippetCard.draggable = true;
        snippetCard.classList.add('settings-snippets-card');


        const img = document.createElement('img');
        img.draggable = false;
        img.classList.add('settings-snippets-card-icon');
        
        const dummyImage = new Image();
        dummyImage.onload = function() { img.src = snippet.icon; } 
        dummyImage.onerror = function() { img.src = 'imgs/icons/question-line.svg';};
        if (snippet.icon != null) dummyImage.src = snippet.icon;

        img.src = (snippet.icon == null || snippet.icon.trim() === "") ? 'imgs/icons/question-line.svg' : snippet.icon;
        img.alt = 'Snippet Icon';
        snippetCard.appendChild(img);

        const nameParagraph = document.createElement('div');
        nameParagraph.innerHTML = snippet.name;
        nameParagraph.classList.add('settings-snippets-card-name');
        snippetCard.appendChild(nameParagraph);

        
        const editIcon = document.createElement('img');
        editIcon.draggable = false;
        editIcon.classList.add('settings-snippets-card-edit');
        editIcon.src = 'imgs/icons/quill-pen-line.svg';
        editIcon.alt = 'Edit Snippet';
        snippetCard.appendChild(editIcon);


        const deleteIcon = document.createElement('img');
        deleteIcon.draggable = false;
        deleteIcon.classList.add('settings-snippets-card-delete');
        deleteIcon.src = 'imgs/icons/delete-bin-line.svg';
        deleteIcon.alt = 'Delete Snippet';
        snippetCard.appendChild(deleteIcon);

        
        deleteIcon.addEventListener('click', event => {
            const objWithIdIndex = customPlugins.findIndex((obj) => obj.id === snippet.id);
            customPlugins.splice(objWithIdIndex, 1);
            loadSnippetCards();
            return;
        });

        editIcon.addEventListener('click', event => {
            settingsSnippetsSnippetName.value = snippet.name;
            settingsSnippetsSnippetIcon.value = (snippet.icon == null) ? 'imgs/icons/question-line.svg' : snippet.icon;
            settingsSnippetsSnippetRegex.value = snippet.toHtmlregex;
            settingsSnippetsSnippetHtml.value = snippet.toHtml;
            settingsSnippetsSnippetRegexHtml.value = snippet.toMarkdownregex;
            settingsSnippetsSnippetMarkdown.value = snippet.toMarkdown;     
            
            fixTextareaHeights();
        });
        
        snippetContainer.appendChild(snippetCard);

    });

    let emptyCard = document.createElement("div");
    emptyCard.style.display = "none";
    emptyCard.setAttribute('id','empty-snippet-card');
    emptyCard.classList.add("settings-snippets-card");
    snippetContainer.appendChild(emptyCard);
}



settingsSnippetsAddSnippet.addEventListener('click', event => {
    if (settingsSnippetsSnippetName.value.trim() === "" || settingsSnippetsSnippetRegex.value.trim() === "" || settingsSnippetsSnippetHtml.value.trim() === "") {
        showPopup("You have to fill the Textfields!", false);
        return;
    }
    console.log(settingsSnippetsSnippetRegexHtml.value)
    console.log(settingsSnippetsSnippetMarkdown.value)
    console.log(settingsSnippetsSnippetRegexHtml.value.trim() === "" || settingsSnippetsSnippetMarkdown.value.trim() === "")
    if(settingsSnippetsSnippetRegexHtml.value.trim() === "" || settingsSnippetsSnippetMarkdown.value.trim() === ""){
        customPlugins.push(createPlugin(
            settingsSnippetsSnippetName.value,
            settingsSnippetsSnippetIcon.value,
            settingsSnippetsSnippetRegex.value, 
            settingsSnippetsSnippetHtml.value
        ));
    }else{
        const customPlugin = new MarkdownPlugin(
            SnippetID++,
            settingsSnippetsSnippetName.value,
            settingsSnippetsSnippetIcon.value,
            settingsSnippetsSnippetRegex.value,
            settingsSnippetsSnippetHtml.value,
            settingsSnippetsSnippetRegexHtml.value, 
            settingsSnippetsSnippetMarkdown.value
          );
        customPlugins.push(customPlugin);
    }
    

    settingsSnippetsSnippetName.value = "";
    settingsSnippetsSnippetRegex.value = "";
    settingsSnippetsSnippetHtml.value = "";
    settingsSnippetsSnippetRegexHtml.value = "";
    settingsSnippetsSnippetMarkdown.value = "";

    loadSnippetCards();
});


function snippetsToJson() {
    const jsonString = JSON.stringify(customPlugins, null, 2);
    return jsonString;
}


settingsSnippetsExportSnippets.addEventListener('click', event => {
    const jsonString = snippetsToJson();

    const blob = new Blob([jsonString], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MARKusSnippets.snip'; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    showPopup("Exported snippets", false);
});

settingsSnippetsImportSnippets.addEventListener('click', event => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.snip';

    fileInput.addEventListener('change', event => {
        var files = event.target.files;
        if (files.length === 0) return; 

        const file = files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            const jsonString = event.target.result;

            try {
                const array = JSON.parse(jsonString);
                
                customPlugins.splice(0, customPlugins.length);
                array.forEach(element => {
                    customPlugins.push(element);
                });
                
            
                loadSnippetCards();
                showPopup("Snippet file import succesfull", false);

            } catch (error) {
                showPopup("Error while importing snippets", false);

                console.error('Error json file not found:', error);
            }
        };

        reader.readAsText(file);
    });

    fileInput.click();
});

settingsSnippetsSaveSnippets.addEventListener('click', event => {
    const jsonString = snippetsToJson();
    localStorage.setItem('snippets', jsonString);
    showPopup("Saved snippets to browser", false);
});


function loadSavedSnippets() {
    if(!localStorage.getItem('snippets')) return;

    const savedJSONstring = localStorage.getItem('snippets');
    savedSnippets = JSON.parse(savedJSONstring);
    customPlugins.splice(0, customPlugins.length);
    
    savedSnippets.forEach(element => {
        customPlugins.push(element);
    });
}

settingsSnippetsDelteSnippets.addEventListener('click', event => {
    if (localStorage.getItem('snippets')) {
        localStorage.removeItem('snippets');
        showPopup("Removed saved Snippets", false);
    } else {
        showPopup("No saved snippets found", false);
    }
});


function fixTextareaHeights() {
    settingsSnippetsSnippetRegex.style.height = settingsSnippetsSnippetRegex.scrollHeight + "px";
    settingsSnippetsSnippetHtml.style.height = settingsSnippetsSnippetHtml.scrollHeight + "px";
}


// Modified Code from: https://www.geeksforgeeks.org/create-a-drag-and-drop-sortable-list-using-html-css-javascript/
const sortableList = document.getElementById("settings-snippets-snippet-list");
let draggedItem = null;

sortableList.addEventListener(
    "dragstart",
    (e) => {
        draggedItem = e.target;
        setTimeout(() => {
            e.target.style.display = "none";
            emptyCard = document.getElementById('empty-snippet-card');
            emptyCard.style.display = "block";
        }, 0);
    });

sortableList.addEventListener(
    "dragend",
    (e) => {
        setTimeout(() => {
            emptyCard.style.display = "none";
            e.target.style.display = "";
            draggedItem = null;
        }, 0);
    });

sortableList.addEventListener(
    "dragover",
    (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(sortableList, e.clientX);
        emptyCard = document.getElementById('empty-snippet-card');
        emptyCard.style.display = "block";
        if (afterElement == null) {
            if(emptyCard.nextSibling != draggedItem)
            sortableList.appendChild(emptyCard);
            sortableList.appendChild(draggedItem);
        } else {
            if(emptyCard.nextSibling != draggedItem)
            sortableList.insertBefore(emptyCard, afterElement);
            sortableList.insertBefore(draggedItem, afterElement);
            
        }
    });

const getDragAfterElement = (container, x) => {
    const draggableElements = [...container.querySelectorAll("div:not(.dragging):not(#empty-snippet-card)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return {
                offset: offset,
                element: child,
            };
        } else {
            return closest;
        }
    }, {
        offset: Number.NEGATIVE_INFINITY,
    }).element;
};


// Preview Snippets

settingsSnippetsPreview.addEventListener('click',async (event) => {
    if(settingsSnippetsPreviewContainer.firstChild.id == 'settings-preview-window-textarea') return;
    if(event.target.classList.contains("ButtonContainer") || event.target.classList.contains("btn")) return;
    replacePreviewWithTextarea(event.target);
});


/**
 * Replace HTML with an Textcontainer
 * @param {HTMLElement} clickedElement
 * @return {void} 
 */
async function replacePreviewWithTextarea(clickedElement) {
    
    if (!clickedElement) return;
    const htmlElement = settingsSnippetsPreviewContainer;
;
  
    try {
        const markdown = await convertHTMLtoMarkdown(htmlElement.outerHTML);
        const createdTextarea = createTextcontainerPreview(markdown);
        settingsSnippetsPreviewContainer.innerHTML = '';
        settingsSnippetsPreviewContainer.insertBefore(createdTextarea,null);
        
        const textarea = createdTextarea;
        //addEventListenersToTextArea(textarea);
        textarea.addEventListener("focusout", async () => {
            const markdownText = textarea.value.trim();
            const html = await convertMarkdownToHTML(markdownText);
            //const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

            settingsSnippetsPreviewContainer.innerHTML = html;
            textarea.remove();
        });
        textarea.focus();
    
        textarea.style.font = document.body.style.fontFamily;
  
  
    } catch (error) {
      console.error(error);
    }
  } 

/**
 * Creates the Textcontainer, containing the textarea object
 * @param {string} string
 * @return {HTMLDivElement} 
 */
function createTextcontainerPreview(string) {
    
    const textarea = document.createElement('textarea');
    textarea.id = 'settings-preview-window-textarea';
    textarea.value = (string) ? string : "";
    
    return textarea;
  }