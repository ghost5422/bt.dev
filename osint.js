// --- CONFIG & CREDENTIALS ---
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

// Global States
let map, trafficLayer, myLocMarker, issMarker;
let deviceMarkers = {}, flightMarkers = [], shipMarkers = [];
let modules = { traffic: true, flights: false, ships: false, iss: true };

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initTimers();
    fetchNews();
    addLog("GEO-INT v13.0 SİSTEMİ ÇEVRİMİÇİ. OPERASYONEL MODÜLLER YÜKLENDİ.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);
    trafficLayer.on('add', () => trafficLayer.getContainer().classList.add('road-flow-layer'));

    map.on('click', onMapClick);
}

function initTimers() {
    setInterval(() => { document.getElementById('sysTime').innerText = new Date().toLocaleTimeString('tr-TR'); }, 1000);
    setInterval(updateISS, 8000);
    setInterval(fetchFlights, 15000);
    setInterval(fetchShips, 20000);
    setInterval(fetchNews, 300000); // 5 dk bir haberler
}

// --- 🎯 HARİTA ANALİZ MODÜLÜ (ADRES + YOL + HAVA) ---
async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[9px] animate-pulse">BÖLGE SORGULANIYOR...</div>').openOn(map);

    try {
        const addrP = fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`).then(r => r.json());
        const flowP = fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`).then(r => r.json());
        const weatherP = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).then(r => r.json());

        const [addr, flow, weather] = await Promise.all([addrP, flowP, weatherP]);

        let trafficStatus = "AKICI", tColor = "text-green-500";
        if (flow.flowSegmentData) {
            const ratio = flow.flowSegmentData.currentSpeed / flow.flowSegmentData.freeFlowSpeed;
            if (ratio < 0.4) { trafficStatus = "KRİTİK YOĞUN"; tColor = "text-red-600"; }
            else if (ratio < 0.8) { trafficStatus = "YOĞUN"; tColor = "text-yellow-500"; }
        }

        popup.setContent(`
            <div class="text-[10px] space-y-2 p-1 font-mono">
                <b class="text-red-600 border-b border-white/10 block pb-1 underline">HEDEF ANALİZ RAPORU</b>
                <div><b>ADRES:</b> <span class="text-white">${addr.addresses ? addr.addresses[0].address.freeformAddress : 'Bilinmiyor'}</span></div>
                <div class="flex justify-between border-y border-white/5 py-1">
                    <span><b>HAVA:</b> ${weather.current_weather.temperature}°C</span>
                    <span><b>RÜZGAR:</b> ${weather.current_weather.windspeed} km/h</span>
                </div>
                <div><b>YOL DURUMU:</b> <span class="${tColor} font-bold">${trafficStatus}</span></div>
                <div class="text-[8px] text-gray-600 pt-1">SAT_LOCK: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            </div>
        `);
    } catch (err) { popup.setContent("Analiz hatası: Bağlantı kesildi."); }
}

// --- 📡 CİHAZ YÖNETİMİ VE SİLME (TAMAMEN ONARILDI) ---
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; 

    if (!data) {
        list.innerHTML = '<div class="text-gray-600 italic text-[9px] text-center">Aktif hedef yok.</div>';
        Object.keys(deviceMarkers).forEach(id => { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; });
        return;
    }

    for (let id in data) {
        const info = data[id];
        const latLng = [info.lat, info.lng];
        
        // Marker Update
        if (deviceMarkers[id]) {
            deviceMarkers[id].setLatLng(latLng);
        } else {
            deviceMarkers[id] = L.marker(latLng, {
                icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` })
            }).addTo(map);
        }

        // List UI
        const div = document.createElement('div');
        div.className = "glass-panel p-3 border-l-2 border-green-500 text-[10px] group pointer-events-auto hover:border-cyan-500 transition-all cursor-pointer mb-2";
        div.onclick = () => { map.flyTo([info.lat, info.lng], 17); addLog(`Hedefe odaklanıldı: ${id}`); };
        
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-green-400 font-bold italic">${id}</span>
                <button onclick="event.stopPropagation(); deleteDevice('${id}')" class="text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:scale-125"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="text-[9px] text-gray-500 mt-2 space-y-1 font-mono">
                <div class="flex justify-between"><span>IP: ${info.ip || '...'}</span> <span>PİL: ${info.battery || '--'}</span></div>
                <div class="text-cyan-500 border-t border-white/10 pt-1 mt-1 font-bold">POS: ${info.lat.toFixed(4)}, ${info.lng.toFixed(4)}</div>
            </div>
        `;
        list.appendChild(div);
    }
});

function deleteDevice(id) {
    showModal("İMHA ONAYI", `${id} kimlikli hedefi veritabanından kalıcı olarak silmek istiyor musunuz?`, "fa-skull-crossbones", true, () => {
        database.ref('locations/' + id).remove().then(() => {
            addLog(`HEDEF İMHA EDİLDİ: ${id}`);
            showModal("İŞLEM BAŞARILI", "Hedef verileri sistemden temizlendi.", "fa-check-double", false);
        }).catch(err => {
            showModal("HATA", "Veri silinemedi: " + err.message, "fa-times-circle", false);
        });
    });
}

// --- 📡 MODÜLLER: UÇAK, GEMİ, HABER, KONUM ---

async function fetchFlights() {
    if (!modules.flights || map.getZoom() < 8) return;
    try {
        const bounds = map.getBounds();
        const url = `https://opensky-network.org/api/states/all?lamin=${bounds.getSouth()}&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`;
        const res = await fetch(url).then(r => r.json());
        flightMarkers.forEach(m => map.removeLayer(m));
        flightMarkers = [];
        if (res.states) {
            res.states.slice(0, 30).forEach(s => {
                const f = L.marker([s[6], s[5]], { icon: L.divIcon({ className: 'f', html: `<i class="fas fa-plane text-yellow-500" style="transform:rotate(${s[10]}deg)"></i>` }) }).addTo(map);
                flightMarkers.push(f);
            });
        }
    } catch (e) {}
}

async function fetchShips() {
    if (!modules.ships || map.getZoom() < 9) return;
    // Gemi verisi (Simüle edilmiş AIS Feed - Ücretsiz API kısıtlamaları nedeniyle taktiksel render)
    shipMarkers.forEach(m => map.removeLayer(m));
    shipMarkers = [];
    const center = map.getCenter();
    // Sahte ama işlevsel gemi verisi oluştur (Ege/Marmara odaklı)
    for(let i=0; i<5; i++) {
        const lat = center.lat + (Math.random() - 0.5) * 0.5;
        const lng = center.lng + (Math.random() - 0.5) * 0.5;
        const s = L.marker([lat, lng], { icon: L.divIcon({ className: 's', html: '<i class="fas fa-ship text-blue-400"></i>' }) }).addTo(map);
        shipMarkers.push(s);
    }
    addLog("Deniz trafiği tarandı.");
}

async function fetchNews() {
    try {
        // News API yerine açık bir RSS Feed Proxy kullanıyoruz (Simüle)
        const news = [
            "KRİTİK: Boğaz trafiği normale döndü.",
            "GÜNCEL: Yeni siber güvenlik yasası onaylandı.",
            "FLAŞ: Teknoloji hisselerinde ralli başladı.",
            "ANLIK: Edirne sınır kapısında yoğunluk azaldı."
        ];
        const container = document.getElementById('newsTicker');
        container.innerHTML = news.map(n => `<div class="border-b border-white/5 pb-1 text-amber-100/70">> ${n}</div>`).join('');
    } catch (e) {}
}

function getMyLocation() {
    addLog("Konum tespiti başlatılıyor...");
    navigator.geolocation.getCurrentPosition(p => {
        const coords = [p.coords.latitude, p.coords.longitude];
        if (myLocMarker) map.removeLayer(myLocMarker);
        myLocMarker = L.circleMarker(coords, { radius: 10, color: '#00ffff', fillColor: '#00ffff', fillOpacity: 0.4 }).addTo(map);
        map.flyTo(coords, 16);
        addLog("Konumunuz tespit edildi: " + coords[0].toFixed(4) + ", " + coords[1].toFixed(4));
        document.getElementById('gpsStatus').innerText = "GPS_SIGNAL_STRONG";
    }, () => showModal("HATA", "GPS Erişimi reddedildi.", "fa-times", false));
}

// --- MODAL & UI YARDIMCILARI ---
function showModal(title, msg, icon, isConfirm, callback) {
    const modal = document.getElementById('tacticModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMsg').innerText = msg;
    document.getElementById('modalIcon').className = `fas ${icon}`;
    
    const btns = document.getElementById('modalButtons');
    btns.innerHTML = '';

    if (isConfirm) {
        const cBtn = document.createElement('button'); cBtn.className = 'modal-btn modal-btn-gray'; cBtn.innerText = 'İPTAL';
        cBtn.onclick = () => modal.classList.add('hidden');
        const oBtn = document.createElement('button'); oBtn.className = 'modal-btn modal-btn-red'; oBtn.innerText = 'ONAYLA';
        oBtn.onclick = () => { modal.classList.add('hidden'); callback(); };
        btns.append(cBtn, oBtn);
    } else {
        const oBtn = document.createElement('button'); oBtn.className = 'modal-btn modal-btn-red border-green-500 text-green-500'; oBtn.innerText = 'TAMAM';
        oBtn.onclick = () => modal.classList.add('hidden');
        btns.appendChild(oBtn);
    }
    modal.classList.remove('hidden');
}

function addLog(m) {
    const f = document.getElementById('dataFeed');
    const d = document.createElement('div');
    d.innerHTML = `<span class="text-red-900">[${new Date().toLocaleTimeString()}]</span> ${m}`;
    f.prepend(d);
}

function toggleLayer(t) {
    modules[t] = !modules[t];
    document.getElementById('btn-' + t).classList.toggle('active');
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    addLog(`${t.toUpperCase()} katmanı güncellendi.`);
}

function updateISS() {
    if (!modules.iss) return;
    fetch('https://api.wheretheiss.at/v1/satellites/25544').then(r => r.json()).then(d => {
        const pos = [d.latitude, d.longitude];
        if (!issMarker) issMarker = L.marker(pos, { icon: L.divIcon({ className: 'i', html: '<i class="fas fa-satellite text-cyan-400 fa-2x animate-pulse"></i>' }) }).addTo(map);
        else issMarker.setLatLng(pos);
    }).catch(() => {});
}

async function searchLocation() {
    const q = document.getElementById('searchInput').value.trim();
    if (!q) return;
    addLog(`Sorgulanıyor: ${q}...`);
    try {
        const res = await fetch(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(q)}.json?key=${TOMTOM_KEY}&limit=1&language=tr-TR`).then(r => r.json());
        if (res.results && res.results[0]) {
            const p = res.results[0].position;
            map.flyTo([p.lat, p.lon], 15);
            addLog(`Bulundu: ${res.results[0].address.freeformAddress}`);
        } else {
            showModal("HATA", "Konum bulunamadı.", "fa-search", false);
        }
    } catch (e) { showModal("HATA", "Bağlantı sorunu.", "fa-wifi", false); }
}

function generateTrackingLink() {
    const nodeId = "NODE_" + (Math.floor(Math.random() * 9000) + 1000);
    const link = `https://berkaytdev.com/track.html?id=${nodeId}`;
    document.getElementById('generatedLink').value = link;
    document.getElementById('linkModal').classList.remove('hidden');
}
