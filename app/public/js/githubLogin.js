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
