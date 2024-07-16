const collabButton = document.getElementById('footer-collab-button');
const collabModal = document.getElementById('collab-modal');

const collabOpenRoomBtn = document.getElementById('collab-open-room-btn');
const collabCloseRoomBtn = document.getElementById('collab-close-room-btn');
const collabRoomID = document.getElementById('collab-room-id');

const collabJoinRoomBtn = document.getElementById('collab-join-room-btn');
const collabInviteCode = document.getElementById('collab-invite-code');

let socket;
let currentRoomID;

collabButton.addEventListener('click', e => {
    collabModal.style.display = collabModal.style.display == 'none' ? 'block' : 'none';
});

collabOpenRoomBtn.addEventListener('click', e => {
    console.log('connecting to the server...');
    socket = io('ws://localhost:8080');

    socket.emit('create-room');

    socket.on('room-created', roomID => {
        console.log(`Room created with ID: ${roomID}`);
        currentRoomID = roomID;
        collabRoomID.innerText = `Room ID: ${roomID}`;
        collabOpenRoomBtn.style.display = 'none';
        collabCloseRoomBtn.style.display = 'block';
        collabRoomID.style.display = 'block';
    });

    socket.on('document-changed', docChanges => {
        const doc = document.getElementById('document-doc');
        doc.innerHTML = docChanges;
    });
});

collabJoinRoomBtn.addEventListener('click', e => {
    const roomID = collabInviteCode.value.trim();
    if (roomID) {
        socket = io('ws://localhost:8080');
        socket.emit('join-room', roomID);

        socket.on('room-joined', (roomID, docChanges) => {
            console.log(`Joined room with ID: ${roomID}`);
            currentRoomID = roomID;
            collabRoomID.innerText = `Room ID: ${roomID}`;
            collabRoomID.style.display = 'block';
            collabOpenRoomBtn.style.display = 'none';
            collabCloseRoomBtn.style.display = 'block';
            const doc = document.getElementById('document-doc');
            doc.innerHTML = docChanges || '';
        });

        socket.on('document-changed', docChanges => {
            const doc = document.getElementById('document-doc');
            doc.innerHTML = docChanges;
        });

        socket.on('error', errorMsg => {
            alert(errorMsg);
        });
    }
});

collabCloseRoomBtn.addEventListener('click', e => {
    if (socket) {
        console.log('disconnecting from the server...');
        socket.disconnect();
        console.log('disconnected from server');
    } else {
        console.log('No active connection to disconnect from.');
    }

    collabOpenRoomBtn.style.display = 'block';
    collabCloseRoomBtn.style.display = 'none';
    collabRoomID.style.display = 'none';
    collabInviteCode.value = '';
});


function documentChanged() {
    console.log("document Changed");
    const doc = document.getElementById('document-doc');

    let clonedDoc = doc.cloneNode(true);

    clonedDoc.querySelectorAll('*').forEach(element => {
        let elementToCheck = findClosestEditableElement(element);
        if (!elementToCheck) element.remove();    
    });

    let docContent = clonedDoc.innerHTML;
    socket.emit('document-changed', currentRoomID, docContent);
}