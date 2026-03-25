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
let flightInterval; // Uçak döngüsünü kontrol etmek için

// SİSTEM BAŞLATMA
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateClock, 1000);
    setInterval(updateISS, 5000); 
    addLog("GEO-INT v10.5 AKTİF. HAVA SAHASI TARANIYOR...");
});

function initMap() {
    // İstanbul merkezli başlat
    map = L.map('map', { center: [41.0082, 28.9784], zoom: 10, zoomControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    
    trafficLayer = L.tileLayer(`https://{s}.api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`, { opacity: 0.8 }).addTo(map);
    
    map.on('click', onMapAnalysis);
}

// --- ✈️ UÇAK TAKİP MOTORU (GÜNCELLENDİ) ---
async function fetchFlights() {
    // Sadece buton aktifse ve harita yeterince yakınsa çalıştır (Zoom > 6)
    if (map.getZoom() < 7) {
        addLog("Uçak takibi için haritaya biraz daha yaklaşın.", true);
        return;
    }

    try {
        const bounds = map.getBounds();
        // OpenSky Bounding Box: lamin, lomin, lamax, lomax
        const url = `https://opensky-network.org/api/states/all?lamin=${bounds.getSouth()}&lomin=${bounds.getWest()}&lamax=${bounds.getNorth()}&lomax=${bounds.getEast()}`;
        
        const res = await fetch(url);
        const data = await res.json();

        // Önceki uçakları temizle
        flightMarkers.forEach(m => map.removeLayer(m));
        flightMarkers = [];

        if (data.states) {
            data.states.forEach(s => {
                const lat = s[6], lng = s[5], callsign = s[1], country = s[2], angle = s[10] || 0;
                
                if (lat && lng) {
                    const fIcon = L.divIcon({
                        className: 'f-icon',
                        html: `<i class="fas fa-plane text-yellow-400 text-lg" style="transform: rotate(${angle-45}deg); text-shadow: 0 0 5px orange;"></i>`
                    });

                    const m = L.marker([lat, lng], { icon: fIcon })
                        .addTo(map)
                        .bindPopup(`
                            <div class="text-[10px] font-mono">
                                <b class="text-yellow-500 underline">UÇUŞ VERİSİ</b><br>
                                <b>KOD:</b> ${callsign}<br>
                                <b>ÜLKE:</b> ${country}<br>
                                <b>İRTİFA:</b> ${Math.round(s[7] || 0)} m<br>
                                <b>HIZ:</b> ${Math.round(s[9] * 3.6)} km/h
                            </div>
                        `);
                    flightMarkers.push(m);
                }
            });
            addLog(`Hava Sahası: ${data.states.length} uçak takipte.`);
        }
    } catch (e) {
        addLog("Uçak API limitine takıldı, bekleniyor...", true);
    }
}

// --- 🚦 TRAFİK ANALİZİ (DÜZELTİLDİ) ---
async function onMapAnalysis(e) {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<div class="text-[9px] animate-pulse">DERİN ANALİZ...</div>').openOn(map);

    try {
        const addrP = fetch(`https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=tr-TR`).then(r => r.json());
        const flowP = fetch(`https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?key=${TOMTOM_KEY}&point=${lat},${lng}`).then(r => r.json());
        const weatherP = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).then(r => r.json());

        const [addr, flow, weather] = await Promise.all([addrP, flowP, weatherP]);

        // ✅ Doğru Trafik Mantığı: Ratio ne kadar yüksekse yol o kadar açık
        let status = "AKICI", color = "text-green-500", desc = "Yol trafiğe tamamen açık.";
        if (flow.flowSegmentData) {
            const ratio = flow.flowSegmentData.currentSpeed / flow.flowSegmentData.freeFlowSpeed;
            if (ratio < 0.35) { status = "KAPALI / YOĞUN"; color = "text-red-500"; desc = "Yol çalışması veya ağır kaza riski."; }
            else if (ratio < 0.75) { status = "ORTA YOĞUN"; color = "text-yellow-500"; desc = "Sıkışıklık mevcut."; }
        }

        popup.setContent(`
            <div class="text-[10px] space-y-2 font-mono">
                <b class="text-red-600 border-b border-white/10 block pb-1 underline">BÖLGESEL İSTİHBARAT</b>
                <div><b>ADRES:</b> <span class="text-white">${addr.addresses[0].address.freeformAddress}</span></div>
                <div class="flex justify-between border-y border-white/5 py-1">
                    <span><b>HAVA:</b> ${weather.current_weather.temperature}°C</span>
                    <span><b>RÜZGAR:</b> ${weather.current_weather.windspeed} km/h</span>
                </div>
                <div><b>TRAFİK:</b> <span class="${color} font-bold">${status}</span></div>
                <div class="bg-red-900/10 p-1 italic text-[8px] border-l-2 border-red-600">${desc}</div>
            </div>
        `);
    } catch (err) { popup.setContent("Analiz hatası."); }
}

// --- MODÜL KONTROL ---
function toggleLayer(t) {
    const btn = document.getElementById('btn-' + t);
    btn.classList.toggle('active');

    if (t === 'traffic') {
        map.hasLayer(trafficLayer) ? map.removeLayer(trafficLayer) : trafficLayer.addTo(map);
    }
    
    if (t === 'flights') {
        if (btn.classList.contains('active')) {
            fetchFlights(); // Hemen çalıştır
            flightInterval = setInterval(fetchFlights, 20000); // 20 saniyede bir güncelle
            addLog("Hava Sahası Taraması Başlatıldı.");
        } else {
            clearInterval(flightInterval);
            flightMarkers.forEach(m => map.removeLayer(m));
            addLog("Hava Sahası Taraması Durduruldu.");
        }
    }
}

// Diğer standart fonksiyonlar (ISS, Clock, Firebase) v10.0 ile aynı kalabilir...
function updateISS() {
    fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(r => r.json()).then(data => {
            const pos = [data.latitude, data.longitude];
            if (!issMarker) issMarker = L.marker(pos, { icon: L.divIcon({ className: 'iss', html: '<i class="fas fa-satellite text-cyan-400 fa-2x animate-pulse"></i>' }) }).addTo(map);
            else issMarker.setLatLng(pos);
        }).catch(() => {});
}

function updateClock() { document.getElementById('sysTime').innerText = new Date().toLocaleTimeString('tr-TR'); }
function addLog(m, isErr = false) {
    const f = document.getElementById('dataFeed');
    const d = document.createElement('div');
    d.innerHTML = `<span class="${isErr ? 'text-red-500' : 'text-red-900'}">[${new Date().toLocaleTimeString()}]</span> ${m}`;
    f.prepend(d);
}

// Cihaz Takip (Firebase)
database.ref('locations').on('value', (snapshot) => {
    const data = snapshot.val();
    const list = document.getElementById('deviceList');
    list.innerHTML = '';
    if (!data) return;
    for (let id in data) {
        const info = data[id];
        const div = document.createElement('div');
        div.className = "glass-panel p-3 border-l-2 border-green-500 text-[10px] group pointer-events-auto hover:border-cyan-500 transition-all cursor-pointer mb-2";
        div.onclick = () => map.flyTo([info.lat, info.lng], 17);
        div.innerHTML = `<div class="flex justify-between"><b>${id}</b> <i class="text-green-500">LIVE</i></div><div class="text-gray-500 mt-1">IP: ${info.ip || '...'}</div>`;
        list.appendChild(div);
        
        if (deviceMarkers[id]) deviceMarkers[id].setLatLng([info.lat, info.lng]);
        else deviceMarkers[id] = L.marker([info.lat, info.lng], { icon: L.divIcon({ className: 'd-icon', html: `<i class="fas fa-crosshairs text-green-500 fa-2x animate-pulse"></i>` }) }).addTo(map);
    }
});
