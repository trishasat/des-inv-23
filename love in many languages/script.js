const words = [
    "LOVE", "AMORE", "L'AMOUR", "LIEBE", "حب", "爱", "KÄRLEK", 
    "사랑", "प्यार", "காதல்", "ప్రేమ", "സ്നേహం", "प्रेम", 
    "AMOR", "愛", "SNEHAM", "PREMAM", "KADHAL", "ANPU", "PREMA", 
    "MOHABBAT", "CINTA", "LIEFDE", "SZERETET", "DRAGOSTE", 
    "MILOSC", "LJUBAV", "AGAPE", "PHILIA", "EROS", "KARUNA", 
    "UPENDO", "AROHA", "ALOHA", "GRÁ", "CARIAD", "ELSKER", 
    "RAKKAUS", "KJÆRLIGHET", "TE AMO", "M’BIFE", "S’AGAPO", "TI AMO"
];

const fonts = [
    "'Playfair Display', serif", 
    "'Courier Prime', monospace", 
    "'Inter', sans-serif", 
    "'Roboto Mono', monospace",
    "'Libre Barcode 39', cursive",
    "Georgia, serif"
];

let historyElements = [];

function updatePoem(e) {
    // Press Space to clear
    if (e.code === "Space") {
        historyElements.forEach(el => el.remove());
        historyElements = [];
        return;
    }

    const container = document.getElementById('container');
    const mainDisplay = document.getElementById('main-display');

    // Create the pink history word
    if (mainDisplay.innerText !== "START") {
        const historyWord = document.createElement('div');
        historyWord.className = 'history-word';
        historyWord.innerText = mainDisplay.innerText;
        historyWord.style.fontFamily = mainDisplay.style.fontFamily;
        
        historyWord.style.left = (Math.random() * 60 + 10) + "%"; 
        historyWord.style.top = (Math.random() * 60 + 10) + "%";
        historyWord.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;
        
        container.appendChild(historyWord);
        historyElements.push(historyWord);

        if (historyElements.length > 3) {
            historyElements.shift().remove();
        }
    }

    // Change the main black word
    const nextWord = words[Math.floor(Math.random() * words.length)];
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    
    mainDisplay.innerText = nextWord;
    mainDisplay.style.fontFamily = randomFont;
}

// Ensure it reacts to both typing and clicking
window.addEventListener('keydown', updatePoem);
window.addEventListener('mousedown', updatePoem);