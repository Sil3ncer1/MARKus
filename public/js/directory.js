const directory = document.getElementById('directory');
const directoryBtn = document.getElementById('directory-button');
const directoryHitboxBtn = document.getElementById('directory-button-hitbox');


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
    }else{
        directory.style.width = "var(--directorySizeOpen)";
        directoryBtn.style.left = "var(--directorySizeOpen)";
    }
});