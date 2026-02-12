document.addEventListener('DOMContentLoaded', () => {
    // Mobil Menü İşlemleri
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });
    }

    // WhatsApp Form Yönlendirme İşlemi
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Sayfanın yenilenmesini engeller

            // Formdaki verileri al
            const ad = document.getElementById('ad').value;
            const konu = document.getElementById('konu').value;
            
            // Yönlendirilecek numara (Başında + olmadan, ülke kodu ile)
            const telefonNumarasi = '905340188445';

            // WhatsApp ekranına düşecek taslak mesaj
            const mesaj = `Merhaba Berkay Bey, ben ${ad}. Siteniz üzerinden ulaşıyorum.\n\nİlgilendiğim konu: ${konu}`;

            // Mesajı URL formatına dönüştür (boşlukları ve özel karakterleri ayarlar)
            const urlEncodedMesaj = encodeURIComponent(mesaj);

            // Hem mobil hem masaüstü için evrensel WhatsApp linki
            const whatsappUrl = `https://wa.me/${telefonNumarasi}?text=${urlEncodedMesaj}`;

            // Linki yeni sekmede aç
            window.open(whatsappUrl, '_blank');
        });
    }
});
