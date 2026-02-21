// =======================================================
// 1. KOPYALAMAYA KARŞI TEMEL ÖNLEMLER
// =======================================================
document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
    if(e.keyCode == 123) { return false; } 
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) { return false; } 
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) { return false; } 
    if(e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) { return false; } 
    if(e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) { return false; } 
};

// =======================================================
// 2. WHATSAPP GÖNDER FONKSİYONU
// =======================================================
function whatsappGonder() {
    const adInput = document.getElementById('ad');
    const konuInput = document.getElementById('konu');
    
    if (!adInput || !konuInput) {
        alert("Hata: Form alanları bulunamadı.");
        return;
    }
    const ad = adInput.value;
    const konu = konuInput.value;
    const numara = "905340188445"; 

    if(ad.trim() === "" || konu === "Genel" || konu === "") {
        alert("Lütfen adınızı girin ve bir konu seçin.");
        return;
    }
    const mesaj = `*WEB SİTESİNDEN MESAJ VAR!* %0A%0A👤 *İsim:* ${ad}%0A📝 *Konu:* ${konu}%0A%0AMerhaba Berkay Bey, hizmetleriniz hakkında görüşmek istiyorum.`;
    window.open(`https://wa.me/${numara}?text=${mesaj}`, '_blank');
}

// =======================================================
// 3. ARAYÜZ ETKİLEŞİMLERİ
// =======================================================
document.addEventListener('DOMContentLoaded', function() {
    
    // --- MOBİL MENÜ ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if(mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
        });
        const navLinks = document.querySelectorAll('.mobile-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('flex');
            });
        });
    }

    // --- DAKTİLO (TYPEWRITER) EFEKTİ ---
    const typedTextSpan = document.getElementById("typed-text");
    const cursorSpan = document.querySelector(".cursor");
    const textArray = [
        "E-Ticaret Sistemlerinde",
        "Yemek Sipariş Yazılımlarında",
        "Özel Web Çözümlerinde",
        "Telegram Bot Entegrasyonunda"
    ];
    const typingDelay = 80, erasingDelay = 40, newTextDelay = 2000;  
    let textArrayIndex = 0, charIndex = 0;

    function type() {
        if (!typedTextSpan) return;
        if (charIndex < textArray[textArrayIndex].length) {
            if(!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
            typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
            charIndex++;
            setTimeout(type, typingDelay);
        } else {
            cursorSpan.classList.remove("typing");
            setTimeout(erase, newTextDelay);
        }
    }
    function erase() {
        if (!typedTextSpan) return;
        if (charIndex > 0) {
            if(!cursorSpan.classList.contains("typing")) cursorSpan.classList.add("typing");
            typedTextSpan.textContent = textArray[textArrayIndex].substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingDelay);
        } else {
            cursorSpan.classList.remove("typing");
            textArrayIndex++;
            if (textArrayIndex >= textArray.length) textArrayIndex = 0;
            setTimeout(type, typingDelay + 500);
        }
    }
    if (textArray.length && typedTextSpan) setTimeout(type, newTextDelay);


    // --- HİZMETLER VİTRİNİ SEKME GEÇİŞLERİ ---
    const vTabs = document.querySelectorAll('.v-tab');
    const contentPanes = document.querySelectorAll('.content-pane');

    vTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            if (this.classList.contains('active')) return;

            vTabs.forEach(t => {
                t.classList.remove('active', 'bg-slate-800/80', 'border-cyan-500/30', 'shadow-[0_0_15px_rgba(6,182,212,0.1)]');
                t.querySelector('.v-tab-icon').classList.remove('scale-110', 'opacity-100');
                t.querySelector('.v-tab-icon').classList.add('opacity-70');
                t.querySelector('.v-tab-title').classList.remove('text-white');
                t.querySelector('.v-tab-title').classList.add('text-slate-300');
                t.querySelector('.v-tab-subtitle').classList.remove('opacity-100', 'h-auto', 'mt-1');
                t.querySelector('.v-tab-subtitle').classList.add('opacity-0', 'h-0');
                const arrow = t.querySelector('.v-tab-arrow');
                if(arrow) { arrow.classList.remove('opacity-100', 'translate-x-0'); arrow.classList.add('opacity-0', '-translate-x-2'); }
            });

            this.classList.add('active', 'bg-slate-800/80', 'border-cyan-500/30', 'shadow-[0_0_15px_rgba(6,182,212,0.1)]');
            this.querySelector('.v-tab-icon').classList.remove('opacity-70');
            this.querySelector('.v-tab-icon').classList.add('scale-110', 'opacity-100');
            this.querySelector('.v-tab-title').classList.remove('text-slate-300');
            this.querySelector('.v-tab-title').classList.add('text-white');
            this.querySelector('.v-tab-subtitle').classList.remove('opacity-0', 'h-0');
            this.querySelector('.v-tab-subtitle').classList.add('opacity-100', 'h-auto', 'mt-1');
            const activeArrow = this.querySelector('.v-tab-arrow');
            if(activeArrow) { activeArrow.classList.remove('opacity-0', '-translate-x-2'); activeArrow.classList.add('opacity-100', 'translate-x-0'); }

            const targetId = this.getAttribute('data-target');
            contentPanes.forEach(pane => {
                pane.classList.remove('block', 'animate-fadeSlideUp');
                pane.classList.add('hidden');
            });

            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                void targetPane.offsetWidth;
                targetPane.classList.add('block', 'animate-fadeSlideUp');

                if (window.innerWidth <= 1024) {
                    const showcaseArea = document.querySelector('.showcase-content-area');
                    const offsetPosition = showcaseArea.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }
        });
    });

    const firstActiveTab = document.querySelector('.v-tab.active');
    if(firstActiveTab) {
        firstActiveTab.classList.add('bg-slate-800/80', 'border-cyan-500/30', 'shadow-[0_0_15px_rgba(6,182,212,0.1)]');
        firstActiveTab.querySelector('.v-tab-icon').classList.remove('opacity-70');
        firstActiveTab.querySelector('.v-tab-icon').classList.add('scale-110', 'opacity-100');
        firstActiveTab.querySelector('.v-tab-title').classList.remove('text-slate-300');
        firstActiveTab.querySelector('.v-tab-title').classList.add('text-white');
        firstActiveTab.querySelector('.v-tab-subtitle').classList.remove('opacity-0', 'h-0');
        firstActiveTab.querySelector('.v-tab-subtitle').classList.add('opacity-100', 'h-auto', 'mt-1');
        const arrow = firstActiveTab.querySelector('.v-tab-arrow');
        if(arrow) { arrow.classList.remove('opacity-0', '-translate-x-2'); arrow.classList.add('opacity-100', 'translate-x-0'); }
    }


    // --- SSS (FAQ) AKORDİYON ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.fa-chevron-down');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active', 'border-cyan-500/40');
                otherItem.querySelector('.faq-answer').style.maxHeight = '0px';
                otherItem.querySelector('.fa-chevron-down').classList.remove('rotate-180', 'text-cyan-500');
                otherItem.querySelector('.fa-chevron-down').classList.add('text-slate-500');
                otherItem.querySelector('.faq-question').classList.remove('text-white');
                otherItem.querySelector('.faq-question').classList.add('text-slate-300');
            });

            if (!isActive) {
                item.classList.add('active', 'border-cyan-500/40');
                answer.style.maxHeight = answer.scrollHeight + "px";
                icon.classList.remove('text-slate-500');
                icon.classList.add('rotate-180', 'text-cyan-500');
                question.classList.remove('text-slate-300');
                question.classList.add('text-white');
            }
        });
    });

    // --- HEADER YUKARI KAYDIRMA ---
    const navbarElement = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if(!navbarElement) return;
        if (window.scrollY > 50) {
            navbarElement.classList.remove('bg-slate-950/80', 'py-4');
            navbarElement.classList.add('bg-slate-950/95', 'py-2', 'shadow-lg');
        } else {
            navbarElement.classList.add('bg-slate-950/80', 'py-4');
            navbarElement.classList.remove('bg-slate-950/95', 'py-2', 'shadow-lg');
        }
    });

    // =======================================================
    // YENİ EKLENEN ANİMASYONLAR (SCROLL REVEAL & COUNTER)
    // =======================================================

    // 1. Scroll Reveal (Aşağı inildikçe beliren elementler)
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Sadece 1 kere çalışsın
            }
        });
    }, { threshold: 0.15 }); // Elementin %15'i ekrana girince tetikle

    revealElements.forEach(el => revealObserver.observe(el));


    // 2. İstatistik Sayacı (0'dan hedef sayıya animasyon)
    const counters = document.querySelectorAll('.counter');
    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute('data-target');
                const duration = 2000; // 2 saniyede tamamlansın
                const increment = target / (duration / 16); // Yaklaşık 60 FPS
                
                let current = 0;
                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.innerText = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter); // Sadece 1 kere çalışsın
            }
        });
    }, { threshold: 0.5 }); // Sayacın %50'si ekrana girdiğinde başlasın

    counters.forEach(counter => counterObserver.observe(counter));

});
