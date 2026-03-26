document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Header Scroll (Optimize Edildi) ---
    const header = document.getElementById('header');
    let scrollTicking = false;

    window.addEventListener('scroll', () => {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) header.classList.add('scrolled');
                else header.classList.remove('scrolled');
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    });

    // --- 2. Mobil Menü ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    const toggleMenu = () => {
        navMenu.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if(navMenu.classList.contains('active')) {
            icon.classList.replace('fa-bars', 'fa-times');
            document.body.style.overflow = 'hidden'; 
        } else {
            icon.classList.replace('fa-times', 'fa-bars');
            document.body.style.overflow = '';
        }
    };
    if(mobileToggle) mobileToggle.addEventListener('click', toggleMenu);
    navLinks.forEach(link => link.addEventListener('click', () => {
        if(navMenu.classList.contains('active')) toggleMenu();
    }));

    // --- 3. Scroll Reveal Animasyonu ---
    const observerOptions = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 };
    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => scrollObserver.observe(el));

    // --- 4. Dinamik Spotlight & 3D Tilt Efekti (Optimize Edildi) ---
    document.querySelectorAll('.premium-card').forEach(card => {
        let cardTicking = false;
        
        card.addEventListener('mousemove', e => {
            if (!cardTicking) {
                window.requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    card.style.setProperty("--mouse-x", `${x}px`);
                    card.style.setProperty("--mouse-y", `${y}px`);

                    if(window.innerWidth > 1024) {
                        const centerX = rect.width / 2;
                        const centerY = rect.height / 2;
                        const rotateX = ((y - centerY) / centerY) * -5; 
                        const rotateY = ((x - centerX) / centerX) * 5;
                        
                        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                        card.classList.remove('tilt-reset');
                    }
                    cardTicking = false;
                });
                cardTicking = true;
            }
        });

        card.addEventListener('mouseleave', () => {
            card.classList.add('tilt-reset');
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
        });
    });

    // --- 5. Manyetik Butonlar (Optimize Edildi) ---
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        let btnTicking = false;
        
        btn.addEventListener('mousemove', e => {
            if (!btnTicking) {
                window.requestAnimationFrame(() => {
                    const rect = btn.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                    btn.classList.remove('reset');
                    btnTicking = false;
                });
                btnTicking = true;
            }
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.classList.add('reset');
            btn.style.transform = `translate(0px, 0px)`;
        });
    });

    // --- 6. SSS Akordeon ---
    document.querySelectorAll('.faq-item').forEach(item => {
        const btn = item.querySelector('.faq-btn');
        const ans = item.querySelector('.faq-ans');
        
        if (item.classList.contains('open') && ans) ans.style.maxHeight = ans.scrollHeight + 'px';
        
        btn?.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item').forEach(x => {
                x.classList.remove('open');
                const a = x.querySelector('.faq-ans');
                if (a) a.style.maxHeight = '0';
            });
            if (!isOpen) {
                item.classList.add('open');
                if (ans) ans.style.maxHeight = ans.scrollHeight + 'px';
            }
        });
    });

    // --- 7. Kriptografik Yazı Yazma (Scramble Typewriter) Efekti ---
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\\\/[]{}—=+*^?#_';
            this.update = this.update.bind(this);
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="scramble-char">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    const phrases = ['Deneyimlere.', 'Kazançlara.', 'Projelerime.'];
    const el = document.querySelector('.scramble-text');
    
    if(el) {
        const fx = new TextScramble(el);
        let counter = 0;
        const next = () => {
            fx.setText(phrases[counter]).then(() => {
                setTimeout(next, 2500);
            });
            counter = (counter + 1) % phrases.length;
        };
        setTimeout(next, 1000);
    }

    // --- 8. Güvenlik ---
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.onkeydown = function(e) {
        if (e.keyCode === 123) return false;
        if (e.ctrlKey && e.shiftKey && ['I','C','J'].includes(String.fromCharCode(e.keyCode))) return false;
        if (e.ctrlKey && e.keyCode === 85) return false;
    };
});

// --- 9. WhatsApp İletişim Formu İşlevi ---
function wpGonder() {
    const adInput = document.getElementById('ad');
    const konuInput = document.getElementById('konu');
    
    const ad = (adInput || {}).value || '';
    const konu = (konuInput || {}).value || '';

    if (!ad.trim() || konu === 'Genel' || !konu) {
        alert('Teknik analiz sürecini başlatmak için lütfen isim ve hizmet türü alanlarını eksiksiz doldurunuz.');
        return;
    }

    const msg = encodeURIComponent(
        `*Proje Analiz Talebi* 🚀\n\n👤 *Yetkili:* ${ad}\n📋 *İlgilenilen Sistem:* ${konu}\n\nMerhaba Berkay Bey, işletmemin dijital altyapısı hakkında detaylı görüşmek istiyorum.`
    );
    window.open(`https://wa.me/905340188445?text=${msg}`, '_blank');
}
