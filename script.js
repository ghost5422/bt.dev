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

// WhatsApp Form
function whatsappGonder(e) {
    e.preventDefault();
    
    const ad = document.getElementById('ad').value;
    const konu = document.getElementById('konu').value;
    const numara = "905340188445"; 

    if(ad === "" || konu === "Genel") {
        alert("Lütfen bilgileri doldurunuz.");
        return;
    }

    const mesaj = `*WEB SİTESİNDEN MESAJ VAR!* %0A%0A👤 *İsim:* ${ad}%0A📝 *Konu:* ${konu}%0A%0AMerhaba Berkay Bey, hizmetleriniz hakkında görüşmek istiyorum.`;
    
    window.open(`https://wa.me/${numara}?text=${mesaj}`, '_blank');
}
