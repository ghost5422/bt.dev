/*
  BERKAYTDEV.COM - OPTİMİZE EDİLMİŞ JS
  Değişiklik Notu: Portföy kartlarındaki fare hareketi (mousemove) animasyonu
  requestAnimationFrame kullanılarak pürüzsüz ve performanslı hale getirildi.
*/

// Gerekli DOM elementlerini bir kez seçerek önbelleğe alalım (caching)
const portfolioCards = document.querySelectorAll('.portfolio-card');
const headerElement = document.querySelector('header');

// Sayfa kaydırma efekti (Plesk gibi bir panelden de yönetilebilir ama JS ile daha kontrol edilebilir)
window.addEventListener('scroll', () => {
    // requestAnimationFrame kullanarak ekran yenileme hızıyla senkronize çalıştıralım
    requestAnimationFrame(() => {
        if (window.scrollY > 50) {
            headerElement.style.padding = '0.5rem 1rem';
            headerElement.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.3)';
        } else {
            headerElement.style.padding = '1rem';
            headerElement.style.boxShadow = 'none';
        }
    });
});

// Portföy kartları için optimize edilmiş fare hareketi animasyonu (Tilt Effect)
portfolioCards.forEach(card => {
    let isRotating = false; // Fare kartın üzerindeyken true olur

    // Dönüşüm hesaplamalarını yapan ana fonksiyon
    const applyTransform = (e) => {
        const rect = card.getBoundingClientRect();
        // Fare pozisyonunu kartın merkezine göre hesapla
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Hassasiyet (daha büyük sayı = daha az dönüş)
        const sensitivity = 20;
        const rotateX = (y - centerY) / sensitivity;
        const rotateY = (centerX - x) / sensitivity;

        // Performanslı 3D dönüşüm
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    // Dönüşümü sıfırlayan fonksiyon
    const resetTransform = () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    };

    // Yüksek Performanslı Mousemove: Sadece isRotating true iken ve requestAnimationFrame içinde çalışır
    card.addEventListener('mousemove', (e) => {
        if (isRotating) {
            // Hesaplama ve çizimi bir sonraki kareye erteler, işlemciyi yormaz
            requestAnimationFrame(() => applyTransform(e));
        }
    });

    // Fare kartın üzerine girdiğinde
    card.addEventListener('mouseenter', () => {
        isRotating = true;
        // Fare hareket edene kadar hafif bir ölçekleme uygula
        requestAnimationFrame(() => card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.02, 1.02, 1.02)`);
    });

    // Fare karttan ayrıldığında
    card.addEventListener('mouseleave', () => {
        isRotating = false;
        requestAnimationFrame(resetTransform);
    });

    // Erişilebilirlik için Klavye Odağı (Aynı efekti tab tuşuyla gezerken de uygularız)
    card.addEventListener('focus', () => {
        // Odaklandığında kartı biraz büyütelim (döndürmeden)
        requestAnimationFrame(() => card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.02, 1.02, 1.02)');
    });

    card.addEventListener('blur', () => {
        requestAnimationFrame(resetTransform);
    });
});
