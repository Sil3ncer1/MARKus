const CLIENT_ID = "Ov23liTsBVLk8CrUWAyW";

const loginButton = document.getElementById('sidebar-github-login');
const logoutButton = document.getElementById('sidebar-github-logout');

let LOGGED_IN = false;
let USED_ID = "";

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

                LOGGED_IN = true;
            } else {
                localStorage.removeItem('accessToken');
                
                console.log('Token is invalid, please log in again.');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    } else {
        logoutButton.style.display = 'none';
        LOGGED_IN = false;
    }
};


async function getUserIdByToken(accessToken) {
    try {
        const response = await fetch(`/get-user-by-token?accessToken=${encodeURIComponent(accessToken)}`);

        if (!response.ok) {
            throw new Error('Error fetching user ID');
        }

        const data = await response.json();
        return data.userId;
    } catch (error) {
        console.error('Error fetching user ID:', error);
        throw error; 
    }
}

async function getRootByUserId(userId) {
    try {
        // Abrufen des Root-Verzeichnisses anhand der userId
        const response = await fetch(`/getRootByUserId?userId=${encodeURIComponent(userId)}`);

        if (!response.ok) {
            throw new Error('Error fetching root directory');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching root directory:', error);
        throw error; 
    }
}

async function getFileById(id) {
    try {
        const response = await fetch(`/getFileById?ownId=${encodeURIComponent(id)}`);

        if (!response.ok) {
            throw new Error('Error fetching file');
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Error fetching file:', error);
        throw error; 
    }
}
