const directory = document.getElementById('directory');
const directoryBtn = document.getElementById('directory-button');
const directoryHitboxBtn = document.getElementById('directory-button-hitbox');

const directoryContainer = document.getElementById('directory-container');

const directoryActionsAddFolder = document.getElementById('directory-actions-add-folder');
const directoryActionsAddFile = document.getElementById('directory-actions-add-file');
const directoryActionsUpload = document.getElementById('directory-actions-upload');
const directoryActionsFileInput= document.getElementById('directory-actions-file-input');


// document.addEventListener('DOMContentLoaded', async () => {  
//     const userId = localStorage.getItem('userId');
  
//     if (userId) {
//         try {
//             const response = await fetch(`/files?userId=${userId}`);
//             if (response.ok) {
//                 const files = await response.json();
//                 console.log(files);
//                 displayFilesInDirectory(files);
//             } else {
//                 console.error('Fehler beim Abrufen der Dateien.');
//             }
//         } catch (error) {
//             console.error('Fehler beim Abrufen der Dateien:', error);
//         }
//     }
// });


function displayFilesInDirectory(files) {
    files.forEach(file => {
        
        // const newFile = document.createElement('li');
        // newFile.classList.add('directory-files');

        // newFile.innerText = file.filename.split('-').slice(1).join('-');

        // directoryContainer.appendChild(newFile);
    });
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

            const response = await fetch('/create-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: folderName,
                    userId: userId,
                    parentId: root.id // Setze parentId auf die ID des Root-Ordners
                })
            });

            if (response.ok) {
                const folder = await response.json();
                console.log('Ordner erfolgreich erstellt:', folder);
                // Aktualisiere die Verzeichnisanzeige
                displayFilesInDirectory([folder]);
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