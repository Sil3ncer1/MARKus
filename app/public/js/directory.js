const directory = document.getElementById('directory');
const directoryBtn = document.getElementById('directory-button');
const directoryHitboxBtn = document.getElementById('directory-button-hitbox');

const directoryContainer = document.getElementById('directory-container');
const directoryExplorer = document.getElementById('directory-explorer');

const directoryActionsAddFolder = document.getElementById('directory-actions-add-folder');
const directoryActionsAddFile = document.getElementById('directory-actions-add-file');
const directoryActionsUpload = document.getElementById('directory-actions-upload');
const directoryActionsFileInput = document.getElementById('directory-actions-file-input');

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
        console.log('Files:', files);
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

async function displayFilesAndDirectories() {
    const userId = await getUserIdByToken(localStorage.getItem('accessToken'));
    const dirs = await fetchUserDirectories(userId);
    const files = await fetchUserFiles(userId);

    directoryExplorer.innerHTML = '';

    await traverseDirectories(dirs);

    console.log(files);

    files.forEach(file => {
        const fileElement = document.createElement('li');
        fileElement.innerHTML = file.filename.split('-').slice(1).join('-');
        fileElement.dataset.ownId = file.id;
        fileElement.classList.add('directory-files');

        fileElement.addEventListener('click', async (element) => {
            const file = await getFileById(element.target.dataset.ownId);
            const filename = file.filename;
            
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
    if (directory.style.width == "var(--directorySizeOpen)") {
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

    const folderName = prompt("Enter the name of the new folder:");
    if (folderName) {
        try {
            const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
            const root = await getRootByUserId(userId); // Get the root folder

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
                // Update the directory display
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
    const fileCreateTime = document.getElementById('settings-info-file-created-value');
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

    // Correction: Get the first element directly
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
            alert(`File successfully uploaded: ${directoryActionsFileInput.files[0].name}`);
        } else {
            alert('Error uploading file.');
        }
    } catch (error) {
        console.error('Error uploading:', error);
        alert('Error uploading file.');
    }

    displayFilesAndDirectories();
});
