// Navbar background on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobile menu toggle
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Scroll reveal animation
const revealEls = document.querySelectorAll('.reveal');
revealEls.forEach((el, i) => el.style.setProperty('--d', i % 8));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealEls.forEach(el => revealObserver.observe(el));

// Animated stat counters
const statEls = document.querySelectorAll('.stat-num');
let countersStarted = false;

function animateCounters() {
  statEls.forEach(el => {
    const target = parseFloat(el.dataset.target);
    const isDecimal = !Number.isInteger(target);
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = isDecimal ? value.toFixed(1) : Math.round(value).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

const statsSection = document.querySelector('.stats');
if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        animateCounters();
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  statsObserver.observe(statsSection);
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Preloader ----------
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  setTimeout(() => preloader.classList.add('hidden'), 500);
});

// ---------- Scroll progress bar ----------
const scrollProgress = document.getElementById('scrollProgress');
function updateScrollProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (scrollProgress) scrollProgress.style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ---------- Theme toggle (light / dark) ----------
const themeToggle = document.getElementById('themeToggle');
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('shrinath-theme', theme); } catch (e) {}
}
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
  });
}

// ---------- Canvas starfield + shooting stars (dark theme only) ----------
const canvas = document.getElementById('starCanvas');
if (canvas && !prefersReducedMotion) {
  const ctx = canvas.getContext('2d');
  let w, h, stars, shootingStars = [];

  function resizeCanvas() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(140, Math.floor((w * h) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.006
    }));
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  function maybeSpawnShootingStar() {
    if (Math.random() < 0.006 && shootingStars.length < 2) {
      const startX = Math.random() * w * 0.6 + w * 0.2;
      shootingStars.push({
        x: startX,
        y: -10,
        len: Math.random() * 80 + 80,
        speed: Math.random() * 6 + 8,
        angle: Math.PI / 3.2,
        life: 1
      });
    }
  }

  function draw(time) {
    if (getTheme() === 'light') {
      ctx.clearRect(0, 0, w, h);
      requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, w, h);

    stars.forEach(s => {
      const twinkle = 0.55 + Math.sin(time * s.speed + s.phase) * 0.45;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,248,225,${Math.max(0, twinkle)})`;
      ctx.fill();
    });

    maybeSpawnShootingStar();
    shootingStars.forEach(s => {
      const dx = Math.cos(s.angle) * s.len;
      const dy = Math.sin(s.angle) * s.len;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - dx, s.y - dy);
      grad.addColorStop(0, `rgba(244,213,141,${s.life})`);
      grad.addColorStop(1, 'rgba(244,213,141,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - dx, s.y - dy);
      ctx.stroke();

      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= 0.012;
    });
    shootingStars = shootingStars.filter(s => s.life > 0 && s.y < h + 50);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

// ---------- 3D tilt on cards ----------
if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll('.service-card, .why-card, .testi-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 14;
      const rotateX = (0.5 - py) * 14;
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---------- Button ripple ----------
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

// ---------- Zodiac wheel (About section) ----------
const zodiacRing = document.getElementById('zodiacRing');
if (zodiacRing) {
  const symbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  const itemHalf = 17;
  const size = zodiacRing.offsetWidth || 320;
  const center = size / 2;
  const radius = center - itemHalf;
  symbols.forEach((sym, i) => {
    const angle = (i / symbols.length) * Math.PI * 2 - Math.PI / 2;
    const item = document.createElement('span');
    item.className = 'zodiac-wheel-item';
    item.textContent = sym;
    item.style.left = `${center + Math.cos(angle) * radius - itemHalf}px`;
    item.style.top = `${center + Math.sin(angle) * radius - itemHalf}px`;
    zodiacRing.appendChild(item);
  });
}

// ---------- Mouse parallax on hero floating icons ----------
if (isFinePointer && !prefersReducedMotion) {
  const heroSection = document.querySelector('.hero');
  const floats = document.querySelectorAll('.zodiac-float, .orbit');
  if (heroSection && floats.length) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      floats.forEach((el, i) => {
        const depth = (i % 4 + 1) * 8;
        el.style.transform = `translate(${px * depth}px, ${py * depth}px)`;
      });
    });
    heroSection.addEventListener('mouseleave', () => {
      floats.forEach(el => { el.style.transform = ''; });
    });
  }
}

// ---------- Chatbot widget ----------
(function () {
  const WA_NUMBER = '917976975872';
  const chatbotEl = document.getElementById('chatbot');
  const toggleBtn = document.getElementById('chatbotToggle');
  const closeBtn = document.getElementById('chatbotClose');
  const bodyEl = document.getElementById('chatbotBody');
  const quickRepliesEl = document.getElementById('chatbotQuickReplies');
  const formEl = document.getElementById('chatbotForm');
  const inputEl = document.getElementById('chatbotInput');
  if (!chatbotEl || !toggleBtn || !bodyEl) return;

  const SERVICES = [
    { label: 'Kundli & Horoscope', text: 'Kundli & Horoscope reading' },
    { label: 'Love & Marriage Matching', text: 'Love & Marriage Matching (Kundli Milan)' },
    { label: 'Vastu Shastra', text: 'Vastu Shastra consultation' },
    { label: 'Palmistry', text: 'Palmistry (Hast Rekha) reading' },
    { label: 'Tarot Reading', text: 'Tarot Reading session' },
    { label: 'Something else', text: null }
  ];

  let chatStarted = false;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function scrollToBottom() {
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function addMessage(sender, html) {
    const div = document.createElement('div');
    div.className = 'msg ' + sender;
    div.innerHTML = `<div class="bubble">${html}</div>`;
    bodyEl.appendChild(div);
    scrollToBottom();
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.innerHTML = '<div class="bubble typing-dots"><span></span><span></span><span></span></div>';
    bodyEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function waLink(text, label) {
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    return `<a class="wa-link" href="${url}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> ${label}</a>`;
  }

  function botReply(html, delay) {
    const typingEl = showTyping();
    setTimeout(() => {
      typingEl.remove();
      addMessage('bot', html);
    }, delay || 700);
  }

  function renderQuickReplies(options) {
    quickRepliesEl.innerHTML = '';
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-reply';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => handleQuickReply(opt));
      quickRepliesEl.appendChild(btn);
    });
  }

  function clearQuickReplies() {
    quickRepliesEl.innerHTML = '';
  }

  function handleQuickReply(opt) {
    addMessage('user', escapeHtml(opt.label));
    clearQuickReplies();
    if (opt.text) {
      const html = `Wonderful! Let's get you connected with Shrinath Ji for <strong>${escapeHtml(opt.label)}</strong>.` +
        waLink(`Namaste Shrinath Ji, I would like to book a consultation for ${opt.text}.`, 'Continue on WhatsApp');
      botReply(html, 800);
    } else {
      botReply("Sure — please type your question below and I'll connect you with Shrinath Ji on WhatsApp.", 700);
    }
  }

  function greet() {
    const html = "🙏 Namaste! I'm the Shrinath Astrology assistant. How can I help you today?";
    const typingEl = showTyping();
    setTimeout(() => {
      typingEl.remove();
      addMessage('bot', html);
      renderQuickReplies(SERVICES);
    }, 600);
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = chatbotEl.classList.toggle('open');
    if (isOpen && !chatStarted) {
      chatStarted = true;
      greet();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => chatbotEl.classList.remove('open'));
  }

  if (formEl && inputEl) {
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputEl.value.trim();
      if (!val) return;
      addMessage('user', escapeHtml(val));
      inputEl.value = '';
      clearQuickReplies();
      const html = "Got it! Let's continue this on WhatsApp so Shrinath Ji can help you directly." +
        waLink(`Namaste Shrinath Ji, ${val}`, 'Continue on WhatsApp');
      botReply(html, 800);
    });
  }
})();
