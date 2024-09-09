const directory = document.getElementById('directory');
const directoryBtn = document.getElementById('directory-button');
const directoryHitboxBtn = document.getElementById('directory-button-hitbox');

const directoryContainer = document.getElementById('directory-container');
const directoryExplorer = document.getElementById('directory-explorer');

const directoryActionsAddFolder = document.getElementById('directory-actions-add-folder');
const directoryActionsAddFile = document.getElementById('directory-actions-add-file');
const directoryActionsUpload = document.getElementById('directory-actions-upload');
const directoryActionsFileInput= document.getElementById('directory-actions-file-input');
const directoryActionsFolderUpload = document.getElementById('directory-actions-folder-upload');
const directoryActionsFolderInput= document.getElementById('directory-actions-folder-input');


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
        fileElement.innerHTML = file.filename.split('-').slice(1).join('-');
        fileElement.dataset.ownId = file.id;
        fileElement.classList.add('directory-files');
    
        // Make the element draggable
        fileElement.setAttribute('draggable', 'true');
    
        // Event for clicking on the file
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

        fileElement.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData("text/plain", file.id);  // Transfer the file ID for later use
            event.dataTransfer.effectAllowed = "move";  // Specify the allowed drag action
        });
        
        // Allow the drop target to accept the drop
        fileElement.addEventListener('dragover', (event) => {
            event.preventDefault();  // Necessary to allow a drop
            event.dataTransfer.dropEffect = "move";
        });
        
        fileElement.addEventListener('drop', async (event) => {
            event.preventDefault();
            event.preventDefault();
            folder = findClosestFolderElement(event.target)
            // folder.classList.remove('drag-over'); // Remove visual feedback
            
            const newParentId = folder.dataset.ownId; // Get the ID of the target folder
            
            const fileId = file.id;

            try {
                const response = await fetch('/move-file', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ fileId, newParentId }),
                });
            
                if (response.ok) {
                    const data = await response.json();
                    console.log('File moved:', data);
                    showPopup('File successfully moved!');
                } else {
                    console.error('Could not move file:', response.statusText);
                    showPopup('Could not move file!');
                }
                } catch (error) {
                console.error('Error:', error);
                showPopup('Error moving file!');
            }
        });
        
        fileElement.addEventListener('dragend', () => {
            console.log("Drag ended");
            displayFilesAndDirectories();
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

        document.querySelectorAll('.directory-folder').forEach(folder => {
            folder.addEventListener('dragover', (event) => {
              event.preventDefault(); // Allow drop
              event.dataTransfer.dropEffect = "move"; // Show move cursor
            //   folder.classList.add('drag-over'); // Optional: Add visual feedback
            });
          
            folder.addEventListener('dragleave', () => {
            //   folder.classList.remove('drag-over'); // Remove visual feedback
            });
          
            folder.addEventListener('drop', async (event) => {
              event.preventDefault();
            //   folder.classList.remove('drag-over'); // Remove visual feedback
          
              const fileId = event.dataTransfer.getData("text/plain");
              const newParentId = findClosestFolderElement(event.target).dataset.ownId; // Get the ID of the target folder
          
              try {
                const response = await fetch('/move-file', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ fileId, newParentId }),
                });
          
                if (response.ok) {
                  const data = await response.json();
                  console.log('File moved:', data);
                  showPopup('File successfully moved!');
                  // Optionally, refresh the file list or update the UI here
                } else {
                  console.error('Could not move file:', response.statusText);
                  showPopup('Could not move file!');
                }
              } catch (error) {
                console.error('Error:', error);
                showPopup('Error moving file!');
              }
            });
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



//MARK:Folder
// Event listener for folder upload button
directoryActionsFolderUpload.addEventListener("click", (event) => {
    if (LOGGED_IN === false && localStorage.getItem("accessToken")) {
        showPopup("You must be logged in");
        return;
    }
    directoryActionsFolderInput.click();
});

// Event listener for file selection
directoryActionsFolderInput.addEventListener('change', async () => {
    if (directoryActionsFolderInput.files.length <= 0) return;

    const files = Array.from(directoryActionsFolderInput.files);
    const filePaths = files.map(file => file.webkitRelativePath);
    const tree = {};

    const addPath = (path, tree) => {
        const createChild = (name) => ({
            name,
            children: []
        });

        const parts = path.split("/");

        if (!tree.name) {
            Object.assign(tree, createChild(parts[0]));
        }

        if (tree.name !== parts[0]) {
            throw new Error(`Root folder is not "${tree.name}"`);
        }
        parts.shift();

        parts.reduce((current, p) => {
            const child = current.children.find((child) => child.name === p);
            if (child) {
                return child;
            }

            const newChild = createChild(p);
            current.children.push(newChild);
            return newChild;
        }, tree);
    };

    filePaths.forEach((path) => addPath(path, tree));

    const userId = await getUserIdByToken(localStorage.getItem("accessToken"));     
    const root = await getRootByUserId(userId); 
    let elementsWithClass = directoryExplorer.querySelectorAll('.selected-folder')[0];
    let parent = root.id;
    if (elementsWithClass) parent = elementsWithClass.dataset.ownId;
    await processTree(tree,parent);
    displayFilesAndDirectories();
});


const createFolder = async (folder, parentId) => {
    try {
        const response = await fetch('/create-folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: folder.name,
                userId: await getUserIdByToken(localStorage.getItem("accessToken")),
                parentId: parentId
            })
        });

        if (response.ok) {
            const newFolder = await response.json();
            return newFolder.id;
        } else {
            throw new Error('Error creating folder.');
        }
    } catch (error) {
        console.error('Error creating folder:', error);
        alert('Error creating folder.');
    }
};

const uploadFile = async (file, parentId) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parentId', parentId);
        formData.append('userId', await getUserIdByToken(localStorage.getItem("accessToken")));

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const message = await response.text();
            showPopup(`File successfully uploaded: ${file.name}`);
        } else {
            throw new Error('Error uploading file.');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file.');
    }
};

const processTree = async (tree, parentId = null) => {
    const queue = [{ node: tree, parentId }];
    let first = true;
    while (queue.length) {
        const { node, parentId } = queue.shift();

        if ( first != true && node.name.includes('.') && node.name.lastIndexOf('.') > node.name.lastIndexOf('/') ) {
            // Handle file
            const file = Array.from(directoryActionsFolderInput.files).find(file => file.webkitRelativePath.endsWith(node.name));
            if (file) {
                await uploadFile(file, parentId);
            }
        } else {
            // Handle folder
            first = false;
            const newParentId = await createFolder(node, parentId);
            node.children.forEach(child => queue.push({ node: child, parentId: newParentId }));
        }
    }
};

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



function addEventListenerToOptionsMenu() {
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

    document.getElementById('directory-directory-options-menu-rename').addEventListener('click', async event => {
        console.log('rename');
        if (selectedOptionsElement == null) return;
        const newFilename = prompt("Enter the name of the new file:");

        if (newFilename.trim() == "") {
            showPopup("The new name cant be empty");
            return;
        }

        const userId = await getUserIdByToken(localStorage.getItem("accessToken"));
        const objectID = selectedOptionsElement.dataset.ownId;

        if (isSelectedOptionsElementFolder) {

            const root = await getRootByUserId(userId);
            if (objectID == root.id) {
                showPopup("You cant rename the Root-Folder");
                return;
            }

            try {
                const response = await fetch('/rename-folder', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, objectID, newFilename }),
                });
            
                if (response.ok) {
                    const data = await response.json();
                    console.log('Folder renamed:', data);
                    showPopup("Folder renamed!");
                } else {
                    console.error('Couldnt rename Folder:', response.statusText);
                    showPopup("Couldnt rename Folder!");
                }
            } catch (error) {
                console.error('Error:', error);
            }
        } else {
            try {
                const response = await fetch('/rename-file', {
                    method: 'POST',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId, objectID, newFilename }),
                });
            
                if (response.ok) {
                    const data = await response.json();
                    console.log('File renamed:', data);
                    showPopup("File renamed!");

                } else {
                    console.error('Couldnt rename File:', response.statusText);
                    showPopup("Couldnt rename File!");
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }

        displayFilesAndDirectories();

    });





}

addEventListenerToOptionsMenu();
