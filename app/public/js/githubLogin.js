const CLIENT_ID = "Ov23liTsBVLk8CrUWAyW";

const loginButton = document.getElementById('sidebar-github-login');
const logoutButton = document.getElementById('sidebar-github-logout');

loginButton.addEventListener('click', e => loginWithGitHub());
logoutButton.addEventListener('click', e => logoutFromGitHub());

function loginWithGitHub() {
    window.location.assign('https://github.com/login/oauth/authorize?client_id=' + CLIENT_ID);
    console.log('login');

}

function logoutFromGitHub() {
    console.log('logout'); 
    localStorage.removeItem('accessToken'); 
    window.location.href = '/'; 
}

window.onload = async function() {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `token ${accessToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                document.getElementById('sidebar-menu').src = userData.avatar_url;
                console.log(userData);
                logoutButton.style.display = 'flex';
                loginButton.style.display = 'none';
            } else {
                localStorage.removeItem('accessToken');
                console.log('Token ist ungültig, bitte erneut einloggen.');
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Benutzerdaten:', error);
        }
    } else {
        logoutButton.style.display = 'none';
    }
};



// const uploadForm = document.getElementById('uploadForm');
// uploadForm.addEventListener('submit', async (event) => {
//     event.preventDefault();

//     const fileInput = document.getElementById('fileInput');
//     const file = fileInput.files[0];

//     if (!file) {
//         alert('Bitte wählen Sie eine Datei aus.');
//         return;
//     }

//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//         const response = await fetch('/upload', {
//             method: 'POST',
//             body: formData
//         });

//         if (response.ok) {
//             const message = await response.text();
//             alert(message);
//         } else {
//             alert('Fehler beim Hochladen der Datei.');
//         }
//     } catch (error) {
//         console.error('Fehler beim Hochladen:', error);
//         alert('Fehler beim Hochladen der Datei.');
//     }
// });