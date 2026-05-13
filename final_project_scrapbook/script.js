let pins = [];
let tempPinElement = null;
let currentCityIndex = null;
let port;
let selectedIndex = 0;
let serialBuffer = ""; //Buffers incoming serial data
let lastButtonState = 1; //Tracks previous button state (1 = unpressed)

window.onload = () => { loadData(); initSpawner(); };

//add city pin + map interactions
function initSpawner() {
    const spawner = document.getElementById('pin-spawner');
    
    spawner.onmousedown = (e) => {
        //create the actual pin that will stay on the map
        const newPin = document.createElement('div');
        newPin.className = 'pin-emoji';
        newPin.innerText = '📍';
        
        //position it where mouse drops it off
        newPin.style.left = e.clientX - 25 + 'px';
        newPin.style.top = e.clientY - 25 + 'px';
        
        document.getElementById('pin-container').appendChild(newPin);
        
        //start dragging new pin
        handlePinSpawningDrag(newPin, e);
    };
}

function handlePinSpawningDrag(el, event) {
    //Prevents the browser from trying to "select" text or drag the button itself
    event.preventDefault(); 
    
    const shiftX = event.clientX - el.getBoundingClientRect().left;
    const shiftY = event.clientY - el.getBoundingClientRect().top;

    function moveAt(e) {
        el.style.left = e.clientX - shiftX + 'px';
        el.style.top = e.clientY - shiftY + 'px';
    }

    //use doc listeners so the pin follows the mouse
    document.addEventListener('mousemove', moveAt);

    document.onmouseup = () => {
        document.removeEventListener('mousemove', moveAt);
        document.onmouseup = null; //reset listener
        
        tempPinElement = el;
        
        //show modal pop up to name city
        document.getElementById('cityNameInput').value = "";
        document.getElementById('details-modal').classList.remove('hidden');
    };
}

function saveCityPin() {
    const name = document.getElementById('cityNameInput').value;
    if (name) {
        // A palette of high-contrast "aura" colors
        const colors = [
            "255,0,50",   //red
            "0,255,50",   //green
            "0,50,255",   //blue
            "255,255,0",  //yellow
            "255,0,255",  //magenta
            "255,100,0"   //orange
        ];
        
        //random select colors for led light on arduino
        const randomAura = colors[Math.floor(Math.random() * colors.length)];
        
        pins.push({ 
            name, 
            x: tempPinElement.style.left, 
            y: tempPinElement.style.top, 
            aura: randomAura,
            scraps: [] 
        });
        
        persist();
        renderPins();
        document.getElementById('details-modal').classList.add('hidden');
        tempPinElement.remove();
    }
}

//create pin, use pin emoji as graphic
function renderPins() {
    const container = document.getElementById('pin-container');
    container.innerHTML = "";
    pins.forEach((p, i) => {
        const pin = document.createElement('div');
        pin.className = 'pin-emoji';
        pin.innerText = '📍';
        pin.style.left = p.x;
        pin.style.top = p.y;
        pin.onclick = (e) => {
            e.stopPropagation();
            openNotebook(i);
        };
        container.appendChild(pin);
    });
}

//mouse logic
function handleScrapDrag(el, event, scrapData) {
    event.preventDefault();
    
    //get mouse coordinates
    const startX = event.clientX;
    const startY = event.clientY;
    
    //get curr position of scrapbook
    const initialLeft = parseInt(el.style.left) || 0;
    const initialTop = parseInt(el.style.top) || 0;

    function moveAt(e) {
        //calculate how far the mouse has moved since the start
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        //update the position
        el.style.left = (initialLeft + deltaX) + 'px';
        el.style.top = (initialTop + deltaY) + 'px';
    }

    const onMouseMove = (e) => moveAt(e);
    document.addEventListener('mousemove', onMouseMove);

    //clean up listener
    document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', onMouseMove);
        
        //save the new position to storage
        scrapData.x = el.style.left;
        scrapData.y = el.style.top;
        persist();
    }, { once: true });
}

//create scrapbook
function renderScraps() {
    const workspace = document.getElementById('scrapbook-workspace');
    workspace.innerHTML = "";
    if (currentCityIndex === null) return;

    pins[currentCityIndex].scraps.forEach((s) => {
        const el = document.createElement('div');
        el.className = 'draggable-scrap ' + (s.type === 'text' ? 'text-scrap' : '');
        el.style.left = s.x; el.style.top = s.y;
        el.style.width = s.w || '200px';
        el.style.height = s.h || 'auto';
        el.style.transform = `rotate(${s.rot})`;
        
        if(s.type === 'image') el.innerHTML = `<img src="${s.content}">`;
        else el.innerText = s.content;

        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        el.appendChild(resizer);

        el.onmousedown = (e) => {
            if (e.target.className === 'resizer') return;
            handleScrapDrag(el, e, s);
        };

        resizer.onmousedown = (e) => {
            e.stopPropagation();
            let startX = e.clientX, startY = e.clientY;
            let startW = parseInt(getComputedStyle(el).width);
            let startH = parseInt(getComputedStyle(el).height);

            const doResize = (re) => {
                el.style.width = (startW + re.clientX - startX) + 'px';
                el.style.height = (startH + re.clientY - startY) + 'px';
            };
            const stopResize = () => {
                document.removeEventListener('mousemove', doResize);
                s.w = el.style.width; s.h = el.style.height;
                persist();
            };
            document.addEventListener('mousemove', doResize);
            document.addEventListener('mouseup', stopResize, { once: true });
        };
        workspace.appendChild(el);
    });
}

function openNotebook(i) {
    currentCityIndex = i;
    document.getElementById('city-page-title').innerText = pins[i].name;
    document.getElementById('map-view').classList.add('hidden');
    document.getElementById('scrapbook-view').classList.remove('hidden');
    renderScraps();
    
    //signal to arduino to pulse led light
    sendToArduino("START_PULSE");
}

//delete city logic
function deleteCurrentCity() {
    if (currentCityIndex === null) return;

    if (confirm(`Delete ${pins[currentCityIndex].name} and its memories?`)) {
        pins.splice(currentCityIndex, 1);
        persist(); 
        sendToArduino("0,0,0");  //turn off led
        currentCityIndex = null;
        selectedIndex = 0; 
        showMapView(); 
        renderPins(); 
    }
}

function handleImageUpload(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        pins[currentCityIndex].scraps.push({ type: 'image', content: event.target.result, x: '100px', y: '100px', w: '250px', h: 'auto', rot: (Math.random() * 10 - 5) + 'deg' });
        persist(); renderScraps();
    };
    reader.readAsDataURL(e.target.files[0]);
}

function addNewText() {
    const text = prompt("Add a note:");
    if (text) {
        pins[currentCityIndex].scraps.push({ type: 'text', content: text, x: '150px', y: '150px', w: '200px', h: 'auto', rot: '0deg' });
        persist(); renderScraps();
    }
}

function showMapView() { 
    document.getElementById('scrapbook-view').classList.add('hidden'); 
    document.getElementById('map-view').classList.remove('hidden'); 
    
    //go back to solid color, no pulse
    sendToArduino("STOP_PULSE");
}

function persist() { localStorage.setItem('map_final_v7', JSON.stringify(pins)); }

function loadData() {
    const saved = localStorage.getItem('map_final_v7');
    if (saved) { pins = JSON.parse(saved); renderPins(); }
}

//arduino integration
async function initSerial() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        document.getElementById('connect-hw').innerText = "Connected ✅";
        readSerial();
    } catch (err) { console.error(err); }
}

async function readSerial() {
    const decoder = new TextDecoder();
    while (port.readable) {
        const reader = port.readable.getReader();
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                //add new data to the buffer
                serialBuffer += decoder.decode(value);
                
                //split by newline and process complete lines
                let lines = serialBuffer.split("\n");
                serialBuffer = lines.pop(); 
                
                for (let line of lines) {
                    processHardwareInput(line);
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
}

//scroll feature on arduino
function processHardwareInput(rawData) {
    // remove characters from serial line
    const match = rawData.trim().match(/Dial_Position:(\d+),Button_State:(\d)/);
    
    //track button state
    if (!match) return;

    const potValue = parseInt(match[1]);
    const btnState = parseInt(match[2]);

    if (pins.length > 0) {
        //Map the dial to the number of pins
        let newIdx = Math.floor((potValue / 1024) * pins.length);
        if (newIdx >= pins.length) newIdx = pins.length - 1;

        // force update move pin
        if (newIdx !== selectedIndex || document.querySelectorAll('.highlighted-pin').length === 0) {
            selectedIndex = newIdx;
            updateUIHighlights(selectedIndex);
        }

        const isOnMap = !document.getElementById('map-view').classList.contains('hidden');
        
        if (btnState === 0 && lastButtonState === 1 && isOnMap) {
            openNotebook(selectedIndex);
        }
    }
    
    lastButtonState = btnState; 
}

function updateUIHighlights(idx) {
    const allPins = document.querySelectorAll('#pin-container .pin-emoji');
    allPins.forEach((p, i) => {
        if (i === idx) {
            p.classList.add('highlighted-pin');
            if (pins[i] && pins[i].aura) {
                sendToArduino(pins[i].aura);
            }
        } else { 
            p.classList.remove('highlighted-pin'); 
        }
    });
}

async function sendToArduino(msg) {
    if (port && port.writable) {
        const writer = port.writable.getWriter();
        await writer.write(new TextEncoder().encode(msg + "\n"));
        writer.releaseLock();
    }
}