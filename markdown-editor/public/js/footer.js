const infiniteBtn = document.getElementById('footer-infinite-view');
const documentBtn = document.getElementById('footer-document-view');
const presentationBtn = document.getElementById('footer-slide-view');

document.addEventListener('DOMContentLoaded', () => {
    const zoomSlider = document.getElementById("zoom-slider");
    const zoomValue = document.getElementById("zoom-value");
    const zoomContainer = document.getElementById("zoom-container");


    zoomSlider.addEventListener('input', event => {
        settingsDisplayDocumentZoom.value = zoomSlider.value;
        const zoomLevel = zoomSlider.value;
    
        zoomValue.textContent = zoomLevel + "%";
    
        // Calculate the translation to keep the container centered
        const containerWidth = zoomContainer.offsetWidth;
        const containerHeight = zoomContainer.offsetHeight;
        const translateX = (containerWidth * (1 - zoomLevel / 100)) / 2;

    
        // Apply translation and scaling in one transform
        if (zoomLevel / 100 < 1) {
            zoomContainer.style.transform = `translate(${translateX}px) scale(${zoomLevel / 100})`;
        } else {
            zoomContainer.style.transform = `scale(${zoomLevel / 100})`;
        }
        
        UpdateSettings();
    });

    zoomValue.addEventListener('click', event => {
        zoomSlider.value = 100;
        zoomContainer.style.transform = `scale(1)`;
        zoomValue.textContent = 100 + "%";
        settingsDisplayDocumentZoom.value = zoomSlider.value;
        UpdateSettings();
    });

});


  

// Left Footer
function setDocumentStats() {
    const wordCounter = document.getElementById('footer-word-count');
    const characterCounter = document.getElementById('footer-character-count');
    const wordCounterSettings = document.getElementById('settings-info-words-value');
    const characterCounterSettings  = document.getElementById('settings-info-characters-value');
    const stats = getDocumentStats();

    wordCounter.innerHTML = stats.words;
    characterCounter.innerHTML = stats.characters;
    wordCounterSettings.innerHTML = stats.words;
    characterCounterSettings.innerHTML = stats.characters;
}


function getDocumentStats() { 
    let docElements = getDocumentElements()

    const documentStats = {
        words: getWordCount(docElements),
        characters: getCharacterCount(docElements),
    }

    return documentStats;
}



function getWordCount(docElements) {
    let words = 0;

    for (let i = 0; i < docElements.length - 1; i++) {
        let textContent = docElements[i].textContent;
        textContent = textContent.trim();
        const wordsArray = textContent.split(/\s+/);
        words += wordsArray.length; 
    }

    return words;
}

function getCharacterCount(docElements) {
    let characters = 0;

    for (let i = 0; i < docElements.length - 1; i++) {
        let textContent = docElements[i].textContent;
        textContent = textContent.replace(/\s/g, '');
        characters += textContent.length;
    }

    return characters;
}


// Right Footer
var selectedViewMode = 0;

infiniteBtn.addEventListener('click', event => {
    if (selectedViewMode == 0) return;

    document.getElementById("document-doc").style.display = "block";


    if (selectedViewMode == 1)
        turnPagesIntoDocument("page-container");
    else
        turnPagesIntoDocument("slide-container");

    swapViewingMode(event.target, 0);    


    document.getElementById("page-container").style.display = "none";
    document.getElementById("slideshow-container").style.display = "none";
});


documentBtn.addEventListener('click', event => {
    if (selectedViewMode == 1) return;
    
    document.getElementById("page-container").style.display = "block";
    
    // if you change from presentation -> document, the turn the pages into a list and back
    if (selectedViewMode == 2) {
        document.getElementById("slideshow-container").style.display = "none";
        turnPagesIntoDocument("slide-container");
    }

    turnListIntoPages(document.getElementById("document-doc").children, "page-container", "page");
    
    document.getElementById("document-doc").style.display = "none";

    swapViewingMode(event.target, 1);
});


var slideIndex = 1;
presentationBtn.addEventListener('click', event => {
    if (selectedViewMode == 2) return;

    document.getElementById("slideshow-container").style.display = "grid";
    
    if (selectedViewMode == 1) {
        document.getElementById("page-container").style.display = "none";
        turnPagesIntoDocument("page-container");
    }
    
    turnListIntoPages(document.getElementById("document-doc").children, "slide-container", "slide");
    
    document.getElementById("document-doc").style.display = "none";

    
    swapViewingMode(event.target, 2);
    
    slideIndex = 1
    showSlides(slideIndex);
});


function swapViewingMode(element, mode) {
    document.getElementById("footer-selected").id = "";
    element.parentNode.id = "footer-selected";
    selectedViewMode = mode;

    if (mode == 2) {
        document.getElementById("slide-prev").style.display = "block";
        document.getElementById("slide-next").style.display = "block";
    } else {
        document.getElementById("slide-prev").style.display = "none";
        document.getElementById("slide-next").style.display = "none";
    }

    enableDragAndDrop();
    setDocumentStats();
}


function turnListIntoPages(list, containerName, pageName) {
    const doc = document.getElementById("document-doc");
    const pages = document.getElementById(containerName);
    
    let currentPage = createPage();
    let currentHeight = 0;
    
    // calculate when to add a new page 
    const computedStyle = getComputedStyle(currentPage);
    const padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const pageHeight = currentPage.offsetHeight - padding; 

    for (let i = 0; i < list.length; i++) {
        const element = list[i];
        const node = element.cloneNode(true);
        

        if (currentHeight > pageHeight || element.firstElementChild.tagName == "HR") {
            currentPage = createPage();
            currentHeight = 0;
        }

        currentPage.appendChild(node);
        currentHeight += node.offsetHeight;
    }

    doc.innerHTML = "";

    function createPage() {
        const page = document.createElement("div");
        page.classList.add(pageName);
        pages.appendChild(page);
        return page;
    }
}


function checkIfPagesAreFull(containerName) {
    const pages = document.getElementById(containerName);

    if (pages.children.length <= 0) return;

    const computedStyle = getComputedStyle(pages.children[0]);
    const padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const maxPageHeight = pages.children[0].offsetHeight - padding; 

    let pageElements = [];
    let fullPageFound = false;

    for (let i = 0; i < pages.children.length; i++) {
        let page = pages.children[i];

        let currentPageHeight = 0;
        for (let j = 0; j < page.children.length; j++) {
            let element = page.children[j];
            currentPageHeight += element.offsetHeight;
            pageElements.push(element.cloneNode(true));
        }


        if (currentPageHeight > maxPageHeight) {
            fullPageFound = true;
        }
    }

    if (fullPageFound) {
        pages.innerHTML = "";
        turnListIntoPages(pageElements);
    }
}

function turnPagesIntoDocument(containerName) {
    const doc = document.getElementById("document-doc");
    const pages = document.getElementById(containerName);

    for (let j = 0; j < pages.children.length; j++) {
        const page = pages.children[j]; 
        for (let i = 0; i < page.children.length; i++) {
            const node = page.children[i].cloneNode(true);
            doc.appendChild(node);
        }
    }

    pages.innerHTML = "";
}




// Next/previous controls
function plusSlides(n) {
  showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let slides = document.getElementsByClassName("slide");
  console.log(slides);
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  slides[slideIndex-1].style.display = "block";
}