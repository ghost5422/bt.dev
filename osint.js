// --- [HİBRİT ARAMA MOTORU: ADRES + UÇUŞ KODU] ---
async function searchLocation() {
    const query = document.getElementById('searchInput').value.trim().toUpperCase();
    if (!query) return;

    addLog(`Sorgulanıyor: ${query}...`);

    try {
        // 1. ADIM: Önce Uçuş Kodu mu diye kontrol et (OpenSky Global Tarama)
        // Not: Uçuş kodları genelde harf ve rakam kombinasyonudur (Örn: TK1903)
        const flightRes = await fetch(`https://opensky-network.org/api/states/all`);
        const flightData = await flightRes.json();
        
        let foundFlight = null;
        if (flightData.states) {
            // Çağrı kodu (s[1]) ile eşleşen uçağı ara
            foundFlight = flightData.states.find(s => s[1].trim().toUpperCase() === query);
        }

        if (foundFlight) {
            const lat = foundFlight[6], lng = foundFlight[5];
            if (lat && lng) {
                map.flyTo([lat, lng], 14, { animate: true, duration: 2 });
                
                // Uçağa özel taktiksel marker ekle
                const targetMarker = L.marker([lat, lng], {
                    icon: L.divIcon({ 
                        className: 'target-lock', 
                        html: '<i class="fas fa-crosshairs text-red-600 fa-3x animate-ping"></i>' 
                    })
                }).addTo(map);

                setTimeout(() => map.removeLayer(targetMarker), 5000); // 5 saniye sonra nişangahı kaldır

                showModal("HEDEF KİLİTLENDİ", 
                    `Uçuş: ${foundFlight[1]}\nÜlke: ${foundFlight[2]}\nİrtifa: ${Math.round(foundFlight[7])}m\nHız: ${Math.round(foundFlight[9] * 3.6)}km/h`, 
                    "fa-plane-arrival", false);
                
                addLog(`Uçuş Bulundu: ${query} - Konuma uçuluyor.`);
                return; // Uçak bulunduysa adres aramasına geçme
            }
        }

        // 2. ADIM: Uçak bulunamadıysa TomTom Adres Aramasına geç (Fallback)
        const addrRes = await fetch(`https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${TOMTOM_KEY}&limit=1&language=tr-TR`);
        const addrData = await addrRes.json();

        if (addrData.results && addrData.results.length > 0) {
            const pos = addrData.results[0].position;
            map.flyTo([pos.lat, pos.lon], 15);
            addLog(`Adres Bulundu: ${addrData.results[0].address.freeformAddress}`);
        } else {
            showModal("HATA", "Girilen kod veya adres sistemde bulunamadı.", "fa-search-minus", false);
        }

    } catch (e) {
        showModal("SİSTEM HATASI", "Veri çekme işlemi başarısız oldu.", "fa-wifi", false);
    }
}
