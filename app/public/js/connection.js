const collabButton = document.getElementById('footer-collab-button');
const collabModal = document.getElementById('collab-modal');

const collabOpenRoomBtn = document.getElementById('collab-open-room-btn');
const collabCloseRoomBtn = document.getElementById('collab-close-room-btn');
const collabExitRoomBtn = document.getElementById('collab-exit-room-btn');

const collabRoomIDText = document.getElementById('collab-room-id-text');
const collabRoomID = document.getElementById('collab-room-id');

const collabJoinRoomBtn = document.getElementById('collab-join-room-btn');
const collabInviteCode = document.getElementById('collab-invite-code');

let socket;
let currentRoomID;

collabButton.addEventListener('click', e => {
    collabModal.style.display = collabModal.style.display == 'none' ? 'block' : 'none';
});


// CREATE
collabOpenRoomBtn.addEventListener('click', e => {
    console.log('connecting to the server...');
    socket = io('ws://localhost:8080');

    const doc = document.getElementById('document-doc');
    const childrenArray = Array.from(doc.children).map(child => child.outerHTML);
    socket.emit('create-room', childrenArray);

    socket.on('room-created', roomID => {
        console.log(`Room created with ID: ${roomID}`);
        currentRoomID = roomID;

        collabOpenRoomBtn.style.display = 'none';
        collabCloseRoomBtn.style.display = 'block';
        collabExitRoomBtn.style.display = 'block';
        collabJoinRoomBtn.style.display = 'none';

        collabRoomIDText.style.display = 'block';
        collabRoomID.innerText = currentRoomID;
        collabInviteCode.style.display = 'none';
    });

    socket.on('element-changed', docChanges => {
        const changedElement = document.querySelector('[data-id="' + docChanges.id + '"]');
        if (changedElement) {
            changedElement.outerHTML = docChanges.content;
            changedElement.classList.remove('document-element-blocked');
        }
            else {
            const doc = document.getElementById('document-doc');
            const element = document.createElement('div');
            element.innerHTML = docChanges.content;
            console.log(doc.insertBefore(element.firstChild, doc.children[docChanges.position-1]));
        }
        enableDragAndDrop();
        showEmptyLineContainer();
    });

    socket.on('element-swapped', change => {
        let changedElement1 = document.querySelector('[data-id="' + change.elementID1 + '"]');
        let changedElement2 = document.querySelector('[data-id="' + change.elementID2 + '"]');
        changedElement1.classList.remove('document-element-blocked', 'document-editable-hover-drop');
        changedElement2.classList.remove('document-element-blocked', 'document-editable-hover-drop');
        
        if(changedElement1 == changedElement2)
            return;

        // Ersetze den Inhalt der Elemente
        changedElement1.outerHTML = change.content2;
        changedElement2.outerHTML = change.content1;

        // Wähle die neuen DOM-Elemente aus, da sich die Referenzen geändert haben
        changedElement1 = document.querySelector('[data-id="' + change.elementID1 + '"]');
        changedElement2 = document.querySelector('[data-id="' + change.elementID2 + '"]');

        // Entferne die Klassen von den neuen Elementen
        if (changedElement1) {
            changedElement1.classList.remove('document-element-blocked', 'document-editable-hover-drop');
        }
        if (changedElement2) {
            changedElement2.classList.remove('document-element-blocked', 'document-editable-hover-drop');
        }

        enableDragAndDrop();

    });

    socket.on('element-removed', elementID => {
        const removedElement = document.querySelector('[data-id="' + elementID + '"]');

        if (removedElement) removedElement.remove();
    });

    socket.on('editing-element', elementID => {
        const editedElement = document.querySelector('[data-id="' + elementID + '"]');

        editedElement.classList.add('document-element-blocked');

    });

    socket.on('send-undo', content => {
        console.log('undo recveived')
        let doc = document.getElementById('document-doc');
        if(content != null)
        doc.innerHTML = content.join('');
        enableDragAndDrop();
    });

    socket.on('send-redo', content => {
        console.log('redo recveived')
        let doc = document.getElementById('document-doc');
        if(content != null)
        doc.innerHTML = content.join('');
        enableDragAndDrop();
    });
});


collabRoomIDText.addEventListener('click', e => {
    // Fallback-Methode für HTTP-Seiten
    let tempInput = document.createElement('textarea');
    tempInput.value = collabRoomID.innerText;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
        document.execCommand('copy');
        showPopup("Code copied!");
    } catch (err) {
        showPopup('Unable to copy text');
    }
    document.body.removeChild(tempInput);
    
    showPopup("Code copied!");
});


// JOIN
collabJoinRoomBtn.addEventListener('click', e => {
    const roomID = collabInviteCode.value.trim();
    if (roomID) {
        socket = io('ws://localhost:8080');
        socket.emit('join-room', roomID);

        socket.on('room-joined', (roomID, docChanges) => {
            console.log(`Joined room with ID: ${roomID}`);
            currentRoomID = roomID;

            
            collabOpenRoomBtn.style.display = 'none';
            collabCloseRoomBtn.style.display = 'none';
            collabExitRoomBtn.style.display = 'block';
            collabJoinRoomBtn.style.display = 'none';
    
            collabRoomIDText.style.display = 'block';
            collabRoomID.innerText = currentRoomID;
            collabInviteCode.style.display = 'none';

            const doc = document.getElementById('document-doc');
            doc.innerHTML = docChanges || '';
            enableDragAndDrop();
        });

        socket.on('element-changed', docChanges => {
            const changedElement = document.querySelector('[data-id="' + docChanges.id + '"]');
            if (changedElement) {
                changedElement.outerHTML = docChanges.content;
                changedElement.classList.remove('document-element-blocked');
            }
                else {
                const doc = document.getElementById('document-doc');
                const element = document.createElement('div');
                element.innerHTML = docChanges.content;
                console.log(doc.insertBefore(element.firstChild, doc.children[docChanges.position-1]));
            }
            enableDragAndDrop();
            showEmptyLineContainer();
        });

        
        socket.on('element-swapped', change => {
            let changedElement1 = document.querySelector('[data-id="' + change.elementID1 + '"]');
            let changedElement2 = document.querySelector('[data-id="' + change.elementID2 + '"]');
            changedElement1.classList.remove('document-element-blocked', 'document-editable-hover-drop');
            changedElement2.classList.remove('document-element-blocked', 'document-editable-hover-drop');

            if(changedElement1 == changedElement2)
                return;
    
            // Ersetze den Inhalt der Elemente
            changedElement1.outerHTML = change.content2;
            changedElement2.outerHTML = change.content1;
    
            // Wähle die neuen DOM-Elemente aus, da sich die Referenzen geändert haben
            changedElement1 = document.querySelector('[data-id="' + change.elementID1 + '"]');
            changedElement2 = document.querySelector('[data-id="' + change.elementID2 + '"]');
    
            // Entferne die Klassen von den neuen Elementen
            if (changedElement1) {
                changedElement1.classList.remove('document-element-blocked', 'document-editable-hover-drop');
            }
            if (changedElement2) {
                changedElement2.classList.remove('document-element-blocked', 'document-editable-hover-drop');
            }
    
            enableDragAndDrop();
        });

        socket.on('element-removed', elementID => {
            const removedElement = document.querySelector('[data-id="' + elementID + '"]');
            if (removedElement) removedElement.remove();

            const doc = document.getElementById('document-doc');
        });

        socket.on('editing-element', elementID => {
            const editedElement = document.querySelector('[data-id="' + elementID + '"]');

            editedElement.classList.add('document-element-blocked');
        });
    
        socket.on('send-undo', content => {
            console.log('undo recveived')
            let doc = document.getElementById('document-doc');
            if(content != null)
            doc.innerHTML = content.join('');
            enableDragAndDrop();
        });
    
        socket.on('send-redo', content => {
            console.log('redo recveived')
            let doc = document.getElementById('document-doc');
            if(content != null)
            doc.innerHTML = content.join('');
            enableDragAndDrop();
        
        });
    }
});

collabExitRoomBtn.addEventListener('click', e => {
    if (socket) {
        console.log('disconnecting from the server...');
        socket.disconnect();
        console.log('disconnected from server');
    } else {
        console.log('No active connection to disconnect from.');
    }

    collabOpenRoomBtn.style.display = 'block';
    collabCloseRoomBtn.style.display = 'none';
    collabExitRoomBtn.style.display = 'none';
    collabJoinRoomBtn.style.display = 'block';

    collabRoomIDText.style.display = 'none';
    collabRoomID.innerText = currentRoomID;
    collabInviteCode.style.display = 'block';

    collabInviteCode.value = '';
});

function documentChanged(elementID) {
    console.log("document Changed");
    const changedElement = document.querySelector('[data-id="' + elementID + '"]');

    const position = Array.from(document.getElementById('document-doc').children).indexOf(changedElement);
    const change = {
        id: elementID,
        content: changedElement.outerHTML,
        position: position,
    };

    socket.emit('element-changed', currentRoomID, change);
}

function removeElement(elementID, position) {
    console.log("element removed");
    const change = {
        id: elementID,
        position: position,
    };
    socket.emit('element-removed', currentRoomID, change);
}

function switchElement(elementID1, elementID2) {
    console.log("element switched");
    const switchedElement1 = document.querySelector('[data-id="' + elementID1 + '"]');
    const switchedElement2 = document.querySelector('[data-id="' + elementID2 + '"]');
    const position1 = Array.from(document.getElementById('document-doc').children).indexOf(switchedElement1);
    const position2 = Array.from(document.getElementById('document-doc').children).indexOf(switchedElement2);
    const change = {
        position1: position1,
        position2: position2,
        elementID1: elementID1,
        elementID2: elementID2,
        content1: switchedElement1.outerHTML,
        content2: switchedElement2.outerHTML,
    };
    socket.emit('element-switched', currentRoomID, change);
}


function sendUndoState() {
    console.log("element Undo");
    socket.emit('state-undo', currentRoomID);
}

function sendRedoState() {
    console.log("element Redo");
    socket.emit('state-redo', currentRoomID);
}

function sendPushState() {
    console.log("element push");
    socket.emit('state-push', currentRoomID);
}

function blockEditedElement(elementID) {
    socket.emit('editing-element', currentRoomID, elementID);
}