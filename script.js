document.addEventListener('contextmenu', e => e.preventDefault());
document.onkeydown = function(e) {
  if (e.keyCode === 123) return false;
  if (e.ctrlKey && e.shiftKey && ['I','C','J'].includes(String.fromCharCode(e.keyCode))) return false;
  if (e.ctrlKey && e.keyCode === 85) return false;
};

function wpGonder() {
  const ad   = (document.getElementById('ad')   || {}).value || '';
  const konu = (document.getElementById('konu') || {}).value || '';
  if (!ad.trim() || konu === 'Genel' || !konu) {
    alert('Lütfen adınızı girin ve bir hizmet türü seçin.');
    return;
  }
  const msg = encodeURIComponent(
    `*WEB SİTESİNDEN MESAJ* 🚀\n\n👤 *İsim:* ${ad}\n📋 *Konu:* ${konu}\n\nMerhaba Berkay Bey, hizmetleriniz hakkında görüşmek istiyorum.`
  );
  window.open(`https://wa.me/905340188445?text=${msg}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {

  // NAVBAR
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });

  // HAMBURGER
  const hbg = document.getElementById('hamburger');
  const mob = document.getElementById('mob-menu');
  let open = false;
  hbg?.addEventListener('click', () => {
    open = !open;
    mob.style.display = open ? 'flex' : 'none';
    const b = hbg.querySelectorAll('span');
    if (open) {
      b[0].style.cssText = 'transform:translateY(7px) rotate(45deg)';
      b[1].style.cssText = 'opacity:0';
      b[2].style.cssText = 'transform:translateY(-7px) rotate(-45deg)';
    } else {
      b.forEach(s => s.style.cssText = '');
    }
  });
  document.querySelectorAll('.mob-link').forEach(l => {
    l.addEventListener('click', () => {
      open = false;
      mob.style.display = 'none';
      hbg.querySelectorAll('span').forEach(s => s.style.cssText = '');
    });
  });

  // TYPEWRITER
  const el  = document.getElementById('typed-text');
  const cur = document.querySelector('.cursor');
  const phrases = [
    'E-Ticaret Sistemlerinde',
    'Yemek Sipariş Yazılımlarında',
    'Özel Web Çözümlerinde',
    'Telegram Bot Entegrasyonunda',
  ];
  let pi = 0, ci = 0, del = false;
  function tick() {
    if (!el) return;
    const w = phrases[pi];
    if (del) {
      el.textContent = w.slice(0, --ci);
      cur?.classList.add('typing');
      if (ci === 0) {
        del = false; pi = (pi + 1) % phrases.length;
        cur?.classList.remove('typing');
        setTimeout(tick, 500); return;
      }
      setTimeout(tick, 38);
    } else {
      el.textContent = w.slice(0, ++ci);
      cur?.classList.add('typing');
      if (ci === w.length) {
        del = true;
        cur?.classList.remove('typing');
        setTimeout(tick, 2200); return;
      }
      setTimeout(tick, 75);
    }
  }
  setTimeout(tick, 800);

  // FAQ
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-btn');
    const ans = item.querySelector('.faq-ans');
    if (item.classList.contains('open') && ans)
      ans.style.maxHeight = ans.scrollHeight + 'px';
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

  // SMOOTH SCROLL
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - 70, behavior: 'smooth' });
    });
  });

  // REVEAL
  const revs = document.querySelectorAll('.reveal');
  revs.forEach(el => {
    if (el.getBoundingClientRect().top >= window.innerHeight)
      el.classList.add('pre');
    else
      el.classList.add('active');
  });
  const ro = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.remove('pre');
        e.target.classList.add('active');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  revs.forEach(el => ro.observe(el));

  // STAGGER CARDS
  const stagger = (sel, delay) => {
    document.querySelectorAll(sel).forEach((c, i) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(20px)';
      c.style.transition = `opacity .55s ${i * delay}s ease, transform .55s ${i * delay}s ease`;
      new IntersectionObserver(([e], ob) => {
        if (e.isIntersecting) {
          c.style.opacity = '1';
          c.style.transform = 'translateY(0)';
          ob.disconnect();
        }
      }, { threshold: 0.12 }).observe(c);
    });
  };
  stagger('.svc-card', 0.1);
  stagger('.p-card', 0.09);

});
