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
    socket.emit('create-room', doc.innerHTML);

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
        changedElement.classList.remove('document-element-blocked');
        changedElement.innerHTML = docChanges.content;
    });

    socket.on('element-removed', elementID => {
        const removedElement = document.querySelector('[data-id="' + elementID + '"]');

        if (removedElement) removedElement.remove();
        if (!doc.hasChildNodes()) showEmptyLineContainer();
    });

    socket.on('editing-element', elementID => {
        const editedElement = document.querySelector('[data-id="' + elementID + '"]');

        editedElement.classList.add('document-element-blocked');
    });
});


collabRoomIDText.addEventListener('click', e => {
    // Copy the text inside the text field
    navigator.clipboard.writeText(collabRoomID.innerText);
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
        });

        socket.on('element-changed', docChanges => {
            const changedElement = document.querySelector('[data-id="' + docChanges.id + '"]');

            if (changedElement) {
                changedElement.innerHTML = docChanges.content;
                changedElement.classList.remove('document-element-blocked');
            }
                else {
                const doc = document.getElementById('document-doc');
                console.log(doc.children[docChanges.position]);
            }
        });

        socket.on('element-removed', elementID => {
            const removedElement = document.querySelector('[data-id="' + elementID + '"]');
            if (removedElement) removedElement.remove();

            const doc = document.getElementById('document-doc');
            if (!doc.hasChildNodes()) showEmptyLineContainer();
            
        });

        socket.on('editing-element', elementID => {
            const editedElement = document.querySelector('[data-id="' + elementID + '"]');

            editedElement.classList.add('document-element-blocked');
        });


        socket.on('error', errorMsg => {
            alert(errorMsg);
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
        content: changedElement.innerHTML,
        position: position,
    };

    socket.emit('element-changed', currentRoomID, change);
}

function removeElement(elementID) {
    socket.emit('element-removed', currentRoomID, elementID);
}


function blockEditedElement(elementID) {
    socket.emit('editing-element', currentRoomID, elementID);
}