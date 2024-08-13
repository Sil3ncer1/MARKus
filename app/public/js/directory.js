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
        throw new Error('Fehler beim Abrufen der Verzeichnisse');
      }
  
      const directories = await response.json();
      console.log('Verzeichnisse:', directories);
      return directories;
    } catch (error) {
      console.error('Fehler beim Abrufen der Verzeichnisse:', error);
      alert('Fehler beim Abrufen der Verzeichnisse.');
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

    let first = true;

    directoryExplorer.innerHTML = '';

    console.log(await traverseDirectories(dirs));
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

    // Root-Verzeichnis erstellen und hinzufügen
    const rootElement = createFolderElement(root);
    directoryExplorer.innerHTML = ''; // Leeren Sie das Verzeichnis, bevor Sie es neu aufbauen.
    directoryExplorer.appendChild(rootElement.folder);

    // Unterordner zum Root hinzufügen
    appendChildren(rootElement.folder.querySelector('ul'), root);
}

function getDirectoriesByParentId(parentDir, dirs) {
    return dirs.filter(dir => dir.parentId === parentDir.id);
}



/*
<li class="directory-folder">
    <details open>
        <summary>Folder 1</summary>
        <ul>
        <li class="directory-folder">
            <details>
            <summary>Folder 2</summary>
            <ul>
                <li class="directory-files">MD File 1</li>
                <li class="directory-files">MD File 2</li>
            </ul>
            </details>
        </li>
        <li class="directory-folder">
            <details>
            <summary>Folder 3</summary>
            <ul>
                <li class="directory-files">JPG File 1</li>
                <li class="directory-files">PNG File 23456789/li>
            </ul>
            </details>
        </li>
        </ul>
    </details>
</li>
<li class="directory-files">MD File 3</li>
*/

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

    const folderName = prompt("Gib den Namen des neuen Ordners ein:");
    if (folderName) {
        try {
            const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
            
            const root = await getRootByUserId(userId); // Abrufen des Root-Ordners

            let elementsWithClass = directoryExplorer.querySelectorAll('.selected-folder')[0];

            console.log(elementsWithClass);

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
                console.log('Ordner erfolgreich erstellt:', folder);
                // Aktualisiere die Verzeichnisanzeige
                displayFilesAndDirectories();
            } else {
                alert('Fehler beim Erstellen des Ordners.');
            }
        } catch (error) {
            console.error('Fehler beim Erstellen des Ordners:', error);
            alert('Fehler beim Erstellen des Ordners.');
        }
    }
});


directoryActionsAddFile.addEventListener("click", (event) => { 
    
});

directoryActionsUpload.addEventListener("click", (event) => { 
    if (LOGGED_IN == false && localStorage.getItem("accessToken")) {
        showPopup("You must be logged in");
        return;
    }
    directoryActionsFileInput.click();
});

directoryActionsFileInput.addEventListener('change', async () => {

    if (directoryActionsFileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', directoryActionsFileInput.files[0]);

        const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
        formData.append('userId', userId);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const message = await response.text();
                alert(`Datei erfolgreich hochgeladen: ${directoryActionsFileInput.files[0].name}`);
            } else {
                alert('Fehler beim Hochladen der Datei.');
            }
        } catch (error) {
            console.error('Fehler beim Hochladen:', error);
            alert('Fehler beim Hochladen der Datei.');
        }
    }
});