// Consolidated site script: single, defensive initialization to avoid duplicate handlers
document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const THEME_KEY = 'mscc:theme';
  const COOKIE_KEY = 'mscc:cookies';
  const themeToggle = document.getElementById('themeToggle');
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const header = document.getElementById('siteHeader') || document.getElementById('mainHeader');
  const yearEl = document.getElementById('year');

  // Theme handling (dark-first, with light option). Defensive and persisted.
  function applyTheme(value) {
    if (value === 'light') root.setAttribute('data-theme', 'light');
    else root.setAttribute('data-theme', 'dark');
    updateThemeButton();
  }
  function updateThemeButton() {
    if (!themeToggle) return;
    const t = root.getAttribute('data-theme') || 'dark';
    themeToggle.setAttribute('aria-pressed', t === 'light');
    themeToggle.textContent = t === 'light' ? '🌞' : '🌗';
  }
  (function initTheme(){
    try{
      const stored = localStorage.getItem(THEME_KEY);
      if(stored) applyTheme(stored);
      else applyTheme('dark');
    }catch(e){ applyTheme('dark'); }

    if(themeToggle) themeToggle.addEventListener('click', ()=>{
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
    });
  })();

  // Cookie banner
  (function initCookies(){
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    const declineBtn = document.getElementById('declineCookies');
    try{
      const consent = localStorage.getItem(COOKIE_KEY);
      if(consent === 'accepted' || consent === 'declined'){ if(cookieBanner) cookieBanner.setAttribute('aria-hidden','true'); }
      else if(cookieBanner) cookieBanner.setAttribute('aria-hidden','false');
    }catch(e){ if(cookieBanner) cookieBanner.setAttribute('aria-hidden','false'); }

    acceptBtn && acceptBtn.addEventListener('click', ()=>{ try{ localStorage.setItem(COOKIE_KEY,'accepted'); }catch(e){}; cookieBanner && cookieBanner.setAttribute('aria-hidden','true'); });
    declineBtn && declineBtn.addEventListener('click', ()=>{ try{ localStorage.setItem(COOKIE_KEY,'declined'); }catch(e){}; cookieBanner && cookieBanner.setAttribute('aria-hidden','true'); });
  })();

  // Mobile nav
  if(hamburger && navMenu){
    hamburger.addEventListener('click', ()=>{
      const open = navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('#navMenu a').forEach(a=>a.addEventListener('click', ()=>{ if(navMenu.classList.contains('open')){ navMenu.classList.remove('open'); hamburger && hamburger.setAttribute('aria-expanded','false'); } } ));
  }

  // Header shrink on scroll
  window.addEventListener('scroll', ()=>{ if(!header) return; header.classList.toggle('shrink', window.scrollY > 48); }, {passive:true});

  // Reveal on scroll
  (function(){
    const reveals = document.querySelectorAll('.reveal');
    if('IntersectionObserver' in window && reveals.length){
      const obs = new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('in-view'); }); },{threshold:0.12});
      reveals.forEach(r=>obs.observe(r));
    } else { reveals.forEach(r=>r.classList.add('in-view')); }
  })();

  // Simple scrollspy for #navMenu links
  (function(){
    const navLinks = Array.from(document.querySelectorAll('#navMenu a'));
    const sections = navLinks.map(a => document.getElementById(a.getAttribute('href').replace('#',''))).filter(Boolean);
    if('IntersectionObserver' in window && sections.length){
      const io = new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ if(entry.isIntersecting){ const id = entry.target.id; navLinks.forEach(a=> a.classList.toggle('active', a.getAttribute('href') === `#${id}`)); } }); },{root:null,rootMargin:'-40% 0px -40% 0px',threshold:0.1});
      sections.forEach(s=>io.observe(s));
    }
  })();

  // Publications filters
  (function initPubFilters(){
    const chips = Array.from(document.querySelectorAll('.filter-chip'));
    const items = Array.from(document.querySelectorAll('#pub-list li'));
    if(!chips.length || !items.length) return;
    const FILTERS = { all: [], molecular: ['sers','raman'], computational: ['dft'], materials: ['catalysis','hydrogen','co2'] };
    function applyFilter(key){ const keywords = FILTERS[key] || []; items.forEach(li => { const text = (li.textContent || '').toLowerCase(); const match = keywords.length === 0 || keywords.some(k => text.includes(k)); li.style.display = match ? 'list-item' : 'none'; }); }
    chips.forEach(chip=> chip.addEventListener('click', ()=>{ chips.forEach(c=>{ c.classList.remove('on'); c.setAttribute('aria-pressed','false'); }); chip.classList.add('on'); chip.setAttribute('aria-pressed','true'); applyFilter((chip.dataset.filter||'all').toLowerCase()); }));
    applyFilter('all'); const first = chips.find(c=>c.dataset.filter==='all')||chips[0]; first && first.classList.add('on');
  })();

  // People cards focusability
  document.querySelectorAll('.person-card').forEach(card=>{ card.setAttribute('tabindex','0'); card.addEventListener('click', ()=>card.focus()); });

  // Modals and email template (if present)
  (function(){
    const personModal = document.getElementById('personModal');
    const emailModal = document.getElementById('emailModal');
    const openEmailBtn = document.getElementById('open-email');
    const copyEmailBtn = document.getElementById('copyEmail');
    const emailTextarea = document.getElementById('emailTemplate');
    let lastFocus = null;

    document.querySelectorAll('.person-card').forEach(btn=>{
      btn.addEventListener('click',(e)=>{
        lastFocus = e.currentTarget;
        const name = btn.dataset.name || btn.querySelector('.person-name')?.textContent || '';
        const role = btn.dataset.role || btn.querySelector('.person-role')?.textContent || '';
        const bio = btn.dataset.bio || '';
        if(personModal){ document.getElementById('modalName') && (document.getElementById('modalName').textContent = name);
          document.getElementById('modalRole') && (document.getElementById('modalRole').textContent = role);
          document.getElementById('modalBio') && (document.getElementById('modalBio').textContent = bio);
          openModal(personModal);
        }
      });
    });

    openEmailBtn && openEmailBtn.addEventListener('click', ()=>{
      const template = `Dear Prof. Al-Saadi,\n\nMy name is [Your Name], and I am interested in joining the MSCC group as [Position].\n\nBest regards,\n[Your Name]`;
      if(emailTextarea) emailTextarea.value = template;
      if(emailModal) openModal(emailModal);
    });

    copyEmailBtn && copyEmailBtn.addEventListener('click', async ()=>{
      try{ await navigator.clipboard.writeText(emailTextarea.value); copyEmailBtn.textContent = 'Copied'; setTimeout(()=>copyEmailBtn.textContent = 'Copy template',1500); }catch(e){ alert('Copy failed'); }
    });

    function openModal(modal){ if(!modal) return; modal.setAttribute('aria-hidden','false'); const close = modal.querySelector('.modal-close'); close && close.focus(); trapKeys(modal); }
    function closeModal(modal){ if(!modal) return; modal.setAttribute('aria-hidden','true'); }
    document.querySelectorAll('.modal').forEach(modal=>{ modal.addEventListener('click', e=>{ if(e.target===modal) closeModal(modal); }); modal.querySelectorAll('.modal-close').forEach(btn=>btn.addEventListener('click', ()=>closeModal(modal))); });
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') document.querySelectorAll('.modal[aria-hidden="false"]').forEach(m=>closeModal(m)); });
    function trapKeys(modal){ const focusable = modal.querySelectorAll('button, [href], textarea, input, [tabindex]:not([tabindex="-1"])'); if(!focusable.length) return; const first = focusable[0], last = focusable[focusable.length-1]; modal.addEventListener('keydown', function handler(e){ if(e.key !== 'Tab') return; if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); } }); }
  })();

  // Year
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Accessibility: keyboard outlines
  function handleFirstTab(e){ if(e.key === 'Tab'){ document.documentElement.classList.add('user-is-tabbing'); window.removeEventListener('keydown', handleFirstTab); } }
  window.addEventListener('keydown', handleFirstTab);

  // Hero slider (auto-advance, respects reduced motion)
  (function initSlider(){
    const slider = document.querySelector('#home .slider');
    if(!slider) return;
    const slides = Array.from(slider.querySelectorAll('li'));
    if(!slides.length) return;
    let idx = slides.findIndex(s=>s.classList.contains('active'));
    if(idx < 0){ idx = 0; slides[0].classList.add('active'); }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced) return;
    let intervalId = null;
    function start(){ intervalId = setInterval(()=>{ slides[idx].classList.remove('active'); idx = (idx + 1) % slides.length; slides[idx].classList.add('active'); }, 3000); }
    function stop(){ if(intervalId) { clearInterval(intervalId); intervalId = null; } }
    start();
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('mouseleave', start);
  })();

});

