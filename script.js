// script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Navbar Scroll Efekti
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
});

// WhatsApp Form Fonksiyonu
function whatsappGonder(e) {
    e.preventDefault();
    
    // HTML'deki id="ad" ve id="konu" alanlarından veri alır
    const ad = document.getElementById('ad').value;
    const konu = document.getElementById('konu').value;
    
    // Telefon numarası (Başında + olmadan, ülke kodu ile)
    const numara = "905340188445"; 

    if(ad === "" || konu === "Genel") {
        alert("Lütfen adınızı girin ve bir konu seçin.");
        return;
    }

    // Mesajı oluştur
    // %0A = Yeni satır
    const mesaj = `*WEB SİTESİNDEN MESAJ VAR!* %0A%0A👤 *İsim:* ${ad}%0A📝 *Konu:* ${konu}%0A%0AMerhaba Berkay Bey, hizmetleriniz hakkında görüşmek istiyorum.`;
    
    // WhatsApp'ı yeni sekmede aç
    window.open(`https://wa.me/${numara}?text=${mesaj}`, '_blank');
}
