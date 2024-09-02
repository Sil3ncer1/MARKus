const directory = document.getElementById('directory');
const directoryBtn = document.getElementById('directory-button');
const directoryHitboxBtn = document.getElementById('directory-button-hitbox');

const directoryContainer = document.getElementById('directory-container');
const directoryExplorer = document.getElementById('directory-explorer');

const directoryActionsAddFolder = document.getElementById('directory-actions-add-folder');
const directoryActionsAddFile = document.getElementById('directory-actions-add-file');
const directoryActionsUpload = document.getElementById('directory-actions-upload');
const directoryActionsFileInput= document.getElementById('directory-actions-file-input');


document.addEventListener('DOMContentLoaded', async () => {  
    displayFilesAndDirectories();
});



async function fetchUserDirectories(userId) {
    try {
        const response = await fetch(`/getDirs?userId=${userId}`);

        if (!response.ok) {
            throw new Error('Error fetching directories');
        }

        const directories = await response.json();
        console.log('Directories:', directories);
        return directories;
    } catch (error) {
        console.error('Error fetching directories:', error);
        alert('Error fetching directories.');
    }
}


async function fetchUserFiles(userId) {
    try {
        const response = await fetch(`/getFiles?userId=${userId}`);
    
        if (!response.ok) {
            throw new Error('Error fetching files');
        }
    
        const files = await response.json();
        console.log('Dateien:', files);
        return files;
    } catch (error) {
        console.error('Error fetching files:', error);
        alert('Error fetching files.');
    }
}


function findClosestFolderElement(element) {
    while (element) {
        if (element.classList.contains('directory-folder'))
            return element;
        
        element = element.parentElement;
    }

    return null;
}


let ACTIVE_FILE = null;

async function displayFilesAndDirectories() {
    const userId = await getUserIdByToken(localStorage.getItem('accessToken'));
    const dirs = await fetchUserDirectories(userId);
    const files = await fetchUserFiles(userId);

    directoryExplorer.innerHTML = '';

    await traverseDirectories(dirs);

    console.log(files);

    files.forEach(file =>  {
        const fileElement = document.createElement('li');
        fileElement.innerHTML = file.filename.split('-').slice(1).join('-');;
        fileElement.dataset.ownId = file.id;
        fileElement.classList.add('directory-files');

        
        fileElement.addEventListener('click', async (element) => {
            const file = await getFileById(element.target.dataset.ownId);
            const filename = file.filename;
            ACTIVE_FILE = element.target.dataset.ownId;
            
            console.log(ACTIVE_FILE);

            const response = await fetch(`/get-file-from-server/${filename}`);
            
            const fileBlob = await response.blob();
            
            const FileFromSystem = {
                blob: fileBlob,
                filename: filename 
            };

            const fileObject = new File([FileFromSystem.blob], FileFromSystem.filename, { type: FileFromSystem.blob.type });

            handleFiles([fileObject]);

            console.log('File saved:', FileFromSystem);

            showPopup("New file loaded: " + filename);
        });

        const dir = document.querySelector(`[data-own-id="${file.directoryId}"]`);
        if (dir) dir.querySelector('ul').appendChild(fileElement);
    });

}



async function traverseDirectories(dirs) {
    const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
    const root = await getRootByUserId(userId);

    const dirMap = new Map();
    dirs.forEach(dir => dirMap.set(dir.id, dir));

    const createFolderElement = (dir) => {
        const folder = document.createElement('li');
        folder.classList.add('directory-folder');
        folder.dataset.parentId = dir.parentId;
        folder.dataset.ownId = dir.id;


        folder.addEventListener('click', (event) => {
            let elementsWithClass = directoryExplorer.querySelectorAll('.selected-folder');

            elementsWithClass.forEach(function (element) {
                element.classList.remove('selected-folder');
            });

            
            let nearestFolder = findClosestFolderElement(event.target);
            nearestFolder.classList.add('selected-folder');
        });

        const folderContainer = document.createElement('details');
        folderContainer.setAttribute('open', true);
        folder.appendChild(folderContainer);

        const folderHeader = document.createElement('summary');
        folderHeader.innerHTML = dir.name;
        folderContainer.appendChild(folderHeader);

        const folderList = document.createElement('ul');
        folderContainer.appendChild(folderList);

        return { folder, folderList };
    }

    const appendChildren = (parentElement, parentDir) => {
        const children = getDirectoriesByParentId(parentDir, dirs);
        children.forEach(child => {
            const { folder, folderList } = createFolderElement(child);
            parentElement.appendChild(folder);
            appendChildren(folderList, child);
        });
    }

    // Create and add the root directory
    const rootElement = createFolderElement(root);
    directoryExplorer.innerHTML = ''; // Clear the directory before rebuilding it.
    directoryExplorer.appendChild(rootElement.folder);

    // Add subfolders to the root
    appendChildren(rootElement.folder.querySelector('ul'), root);
}

function getDirectoriesByParentId(parentDir, dirs) {
    return dirs.filter(dir => dir.parentId === parentDir.id);
}


document.addEventListener('mousemove', (event) => {
    directoryBtn.style.top = -50 + event.clientY + "px";
});

directoryHitboxBtn.addEventListener("mouseover", (event) => {
    directoryBtn.style.width = "2em";
});

directoryHitboxBtn.addEventListener("mouseleave", (event) => {
    directoryBtn.style.width = "0%";
});

directoryBtn.addEventListener("click", (event) => {
    if(directory.style.width == "var(--directorySizeOpen)"){
        directory.style.width = "var(--directorySizeClose)";
        directoryBtn.style.left = "2.5em";
        directoryHitboxBtn.style.width = "var(--directoryHitboxSizeClose)";
    } else {
        directory.style.width = "var(--directorySizeOpen)";
        directoryBtn.style.left = "var(--directorySizeOpen)";
        directoryHitboxBtn.style.width = "var(--directoryHitboxSize)";
    }
});

directoryActionsAddFolder.addEventListener("click", async (event) => { 
    if (LOGGED_IN === false || !localStorage.getItem("accessToken")) {
        showPopup("You must be logged in");
        return;
    }

    const folderName = prompt('Folder Name: ');

    if (folderName) {
        try {
            const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
            
            const root = await getRootByUserId(userId); 

            let elementsWithClass = directoryExplorer.querySelectorAll('.selected-folder')[0];

            let parent = root.id;

            if (elementsWithClass) parent = elementsWithClass.dataset.ownId;

            const response = await fetch('/create-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    userId: userId,
                    parentId: parent 
                })
            });

            if (response.ok) {
                const folder = await response.json();
                console.log('Folder successfully created:', folder);

                displayFilesAndDirectories();
            } else {
                alert('Error creating folder.');
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Error creating folder.');
        }
    }
});


directoryActionsAddFile.addEventListener("click", async (event) => { 
    let filename = document.getElementById('settings-meta-filename');
    let metadata = document.getElementById('settings-meta');
    const fileCreateTime  = document.getElementById('settings-info-file-created-value');
    const doc = document.getElementById('document-doc');
    
    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+ today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    fileCreateTime.innerHTML = date;

    filename.value = '';
    metadata.value = '';

    while (doc.firstChild){
        if(socket) removeElement(doc.firstChild.dataset.id);
        doc.firstChild.remove();
    }

    showEmptyLineContainer();

    const userId = await getUserIdByToken(localStorage.getItem("accessToken"));            
    const root = await getRootByUserId(userId);

    let elementsWithClass = directoryExplorer.querySelectorAll('.selected-folder')[0];
    let parent = root.id;

    if (elementsWithClass) parent = elementsWithClass.dataset.ownId;

    const newFilename = prompt("Enter the name of the new file:");

    try {
        const response = await fetch('/create-empty-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename: newFilename, parentId: parent, userId: userId }),
        });

        if (!response.ok) {
            throw new Error('Error creating file.');
        }

        showPopup("New File Created");
    } catch (error) {
        console.error('Error creating file:', error);
        showPopup("Error: Could not create file.");
    }

    displayFilesAndDirectories();

    showPopup("New File Created");

});

directoryActionsUpload.addEventListener("click", (event) => { 
    if (LOGGED_IN == false && localStorage.getItem("accessToken")) {
        showPopup("You must be logged in");
        return;
    }
    directoryActionsFileInput.click();
});

directoryActionsFileInput.addEventListener('change', async () => {
    if (directoryActionsFileInput.files.length <= 0) return;

    const formData = new FormData();
    formData.append('file', directoryActionsFileInput.files[0]);

    // Korrektur: Abrufen des ersten Elements direkt
    const elementWithClass = directoryExplorer.querySelector('.selected-folder');
    const parentId = elementWithClass ? elementWithClass.dataset.ownId : null;

    formData.append('parentId', parentId);

    const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
    formData.append('userId', userId);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const message = await response.text();
            showPopup(`File successfully uploaded: ${directoryActionsFileInput.files[0].name}`);
        } else {
            alert('Error uploading file.');
        }
    } catch (error) {
        console.error('Error uploading:', error);
        alert('Error uploading file.');
    }

    displayFilesAndDirectories();
});











// OPTIONS-MENU

directoryExplorer.addEventListener('contextmenu', event => {
    if (!window.getSelection().toString()) {
        event.preventDefault();
        setOptionsMenu(event);
    }
});


document.addEventListener('click', event => {
    document.getElementById('directory-options-menu').style.display = 'none';
});

let selectedOptionsElement = null;
let isSelectedOptionsElementFolder = false; 

function setOptionsMenu(event) {
    let clickedElement = event.target;
    isSelectedOptionsElementFolder = false;


    if (!clickedElement.classList.contains('directory-files'))  {
        clickedElement = findClosestFolderElement(clickedElement);
        isSelectedOptionsElementFolder = true;
    }
    
    selectedOptionsElement = clickedElement;

    let optionsMenu = document.getElementById('directory-options-menu');
    optionsMenu.style.left = event.pageX + 'px';
    optionsMenu.style.top = event.pageY + 'px';
    optionsMenu.style.display = 'block';
}



function  addEventListenerToOptionsMenu() {
    document.getElementById('directory-directory-options-menu-delete').addEventListener('click', async event => {
        if (selectedOptionsElement == null) return;

        console.log(selectedOptionsElement);

        console.log(selectedOptionsElement.dataset.ownId + " folder: " + isSelectedOptionsElementFolder);

        const delteElement = confirm("are you sure you want to delete this Objekt?");

        if (!delteElement) return;

        const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
        const objectID = selectedOptionsElement.dataset.ownId;


        console.log("USER: " + userId + " FOLDER: " + objectID);

        if (isSelectedOptionsElementFolder) {

            const root = await getRootByUserId(userId);
            if (objectID == root.id) {
                showPopup("You cant delte the Root-Folder");
                return;
            }

            try {
                const response = await fetch('/delete-folder', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, objectID }),
                });
            
                if (response.ok) {
                    const data = await response.json();
                    console.log('Folder deleted:', data);
                    showPopup("Folder deleted!");
                } else {
                    console.error('Couldnt delete Folder:', response.statusText);
                    showPopup("Couldnt delete Folder!");
                }
            } catch (error) {
                console.error('Fehler:', error);
            }
        } else {
            try {
                const response = await fetch('/delete-file', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, objectID }),
                });
            
                if (response.ok) {
                    const data = await response.json();
                    console.log('File deleted:', data);
                    showPopup("File deleted!");

                } else {
                    console.error('Couldnt delete File:', response.statusText);
                    showPopup("Couldnt delete File!");
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        displayFilesAndDirectories();

    });
}

addEventListenerToOptionsMenu();
