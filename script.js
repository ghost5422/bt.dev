// script.js

// --- KOPYALAMAYA KARŞI TEMEL ÖNLEMLER (CAYDIRICILAR) ---
document.addEventListener('contextmenu', event => event.preventDefault());

document.onkeydown = function(e) {
    if(e.keyCode == 123) { return false; } // F12
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; } // Ctrl+Shift+I
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; } // Ctrl+Shift+C
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { return false; } // Ctrl+Shift+J
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; } // Ctrl+U
};
// -------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Navbar Scroll Efekti
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 2. Mobil Menü Fonksiyonu (EKLENDİ)
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', function() {
            // Tailwind class'ları ile görünürlüğü yönetme
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });
    }
});

// 3. WhatsApp Form Fonksiyonu
function whatsappGonder() {
    
    // HTML'deki id="ad" ve id="konu" alanlarından veri alır
    const adInput = document.getElementById('ad');
    const konuInput = document.getElementById('konu');
    
    // Hata kontrolü
    if (!adInput || !konuInput) {
        alert("Hata: Form alanları bulunamadı.");
        return;
    }

    const ad = adInput.value;
    const konu = konuInput.value;
    
    // Telefon numarası
    const numara = "905340188445"; 

    // Doğrulama
    if(ad.trim() === "" || konu === "Genel" || konu === "") {
        alert("Lütfen adınızı girin ve bir konu seçin.");
        return;
    }

    // Mesajı oluştur
    const mesaj = `*WEB SİTESİNDEN MESAJ VAR!* %0A%0A👤 *İsim:* ${ad}%0A📝 *Konu:* ${konu}%0A%0AMerhaba Berkay Bey, hizmetleriniz hakkında görüşmek istiyorum.`;
    
    // WhatsApp'ı yeni sekmede aç
    window.open(`https://wa.me/${numara}?text=${mesaj}`, '_blank');
}
