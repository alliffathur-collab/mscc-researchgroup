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

  // Smooth scrolling for navigation links
  (function(){
    const navLinks = document.querySelectorAll('#navMenu a[href^="#"]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if(targetSection) {
          const headerHeight = header ? header.offsetHeight : 72;
          const targetPosition = targetSection.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  })();

  // Publications filters
  (function initPubFilters(){
    const chips = Array.from(document.querySelectorAll('.pub-filters .filter-chip'));
    const items = Array.from(document.querySelectorAll('.publication-card'));
    const viewMoreBtn = document.getElementById('pub-view-more');
    if(!chips.length || !items.length) return;
    
    const FILTERS = { all: [], molecular: ['sers','raman'], computational: ['dft'], materials: ['catalysis','hydrogen','co2'] };
    const INITIAL_COUNT = 5;
    let showingAll = false;
    let currentFilter = 'all';
    
    function applyFilter(key){
      currentFilter = key;
      const keywords = FILTERS[key] || [];
      let visibleCount = 0;
      
      items.forEach((card, index) => {
        const cardKeywords = (card.dataset.keywords || '').toLowerCase();
        const matchesFilter = keywords.length === 0 || keywords.some(k => cardKeywords.includes(k));
        
        if(matchesFilter){
          if(!showingAll && visibleCount >= INITIAL_COUNT){
            card.style.display = 'none';
          } else {
            card.style.display = 'block';
          }
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      
      // Show/hide view more button
      if(viewMoreBtn){
        if(visibleCount > INITIAL_COUNT){
          viewMoreBtn.classList.remove('hidden');
          viewMoreBtn.textContent = showingAll ? 'View Less' : 'View More';
        } else {
          viewMoreBtn.classList.add('hidden');
        }
      }
    }
    
    chips.forEach(chip=> {
      chip.addEventListener('click', ()=>{
        showingAll = false; // Reset when switching filters
        chips.forEach(c=>{ 
          c.classList.remove('on'); 
          c.setAttribute('aria-pressed','false'); 
        }); 
        chip.classList.add('on'); 
        chip.setAttribute('aria-pressed','true'); 
        applyFilter((chip.dataset.filter||'all').toLowerCase());
      });
    });
    
    // View More button handler
    if(viewMoreBtn){
      viewMoreBtn.addEventListener('click', ()=>{
        showingAll = !showingAll;
        applyFilter(currentFilter);
      });
    }
    
    applyFilter('all'); 
    const first = chips.find(c=>c.dataset.filter==='all')||chips[0]; 
    if(first) {
      first.classList.add('on');
      first.setAttribute('aria-pressed','true');
    }
  })();

  // People filters
  (function initPeopleFilters(){
    const chips = Array.from(document.querySelectorAll('.people-filters .filter-chip'));
    const personCards = Array.from(document.querySelectorAll('.person-card'));
    const alumniItems = Array.from(document.querySelectorAll('.alumni-item'));
    const allItems = [...personCards, ...alumniItems];
    if(!chips.length || !allItems.length) return;
    
    function applyFilter(category){
      allItems.forEach(item => {
        const itemCategory = (item.dataset.category || '').toLowerCase();
        const match = itemCategory === category;
        item.style.display = match ? '' : 'none';
      });
    }
    
    chips.forEach(chip=> {
      chip.addEventListener('click', ()=>{
        chips.forEach(c=>{ 
          c.classList.remove('on'); 
          c.setAttribute('aria-pressed','false'); 
        }); 
        chip.classList.add('on'); 
        chip.setAttribute('aria-pressed','true'); 
        applyFilter((chip.dataset.filter||'pi').toLowerCase());
      });
    });
    
    // Initialize with first filter (Principal Investigator)
    const first = chips[0]; 
    if(first) {
      first.classList.add('on');
      first.setAttribute('aria-pressed','true');
      applyFilter((first.dataset.filter||'pi').toLowerCase());
    }
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

  // Hero slider (auto-advance, respects reduced motion, with manual navigation)
  (function initSlider(){
    const slider = document.querySelector('#home .slider');
    if(!slider) return;
    const slides = Array.from(slider.querySelectorAll('li'));
    if(!slides.length) return;
    const prevBtn = slider.querySelector('.slider-arrow-prev');
    const nextBtn = slider.querySelector('.slider-arrow-next');
    
    let idx = slides.findIndex(s=>s.classList.contains('active'));
    if(idx < 0){ idx = 0; slides[0].classList.add('active'); }
    
    function goToSlide(newIdx) {
      slides[idx].classList.remove('active');
      idx = newIdx;
      slides[idx].classList.add('active');
    }
    
    function nextSlide() {
      goToSlide((idx + 1) % slides.length);
    }
    
    function prevSlide() {
      goToSlide((idx - 1 + slides.length) % slides.length);
    }
    
    // Manual navigation
    if(prevBtn) prevBtn.addEventListener('click', () => { stop(); prevSlide(); start(); });
    if(nextBtn) nextBtn.addEventListener('click', () => { stop(); nextSlide(); start(); });
    
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced) return;
    
    let intervalId = null;
    function start(){ intervalId = setInterval(nextSlide, 5000); }
    function stop(){ if(intervalId) { clearInterval(intervalId); intervalId = null; } }
    start();
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('mouseleave', start);
  })();

  // Media Gallery functionality
  (function initMediaGallery(){
    const galleryTabs = document.querySelectorAll('.gallery-tab');
    const galleryContents = document.querySelectorAll('.gallery-content');
    const photoSlides = document.querySelectorAll('.photo-slide');
    const galleryDots = document.querySelectorAll('.gallery-dot');
    const prevBtn = document.querySelector('.gallery-nav.prev');
    const nextBtn = document.querySelector('.gallery-nav.next');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.querySelector('.lightbox-image');
    const lightboxClose = document.querySelector('.lightbox-close');
    const galleryItems = document.querySelectorAll('.gallery-item');

    let currentSlide = 0;

    // Tab switching
    galleryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update tab states
        galleryTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');
        
        // Update content visibility
        galleryContents.forEach(content => {
          content.classList.remove('active');
          if(content.id === `${targetTab}-gallery`) {
            content.classList.add('active');
          }
        });
      });
    });

    // Photo slideshow navigation
    function showSlide(n) {
      if(!photoSlides.length) return;
      
      if(n >= photoSlides.length) currentSlide = 0;
      else if(n < 0) currentSlide = photoSlides.length - 1;
      else currentSlide = n;
      
      photoSlides.forEach((slide, idx) => {
        slide.classList.toggle('active', idx === currentSlide);
      });
      
      galleryDots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentSlide);
      });
    }

    if(prevBtn) {
      prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    }

    if(nextBtn) {
      nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    }

    // Dot navigation
    galleryDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => showSlide(idx));
    });

    // Lightbox functionality
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if(img && lightbox && lightboxImg) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          lightbox.setAttribute('aria-hidden', 'false');
        }
      });
    });

    if(lightboxClose) {
      lightboxClose.addEventListener('click', () => {
        if(lightbox) lightbox.setAttribute('aria-hidden', 'true');
      });
    }

    if(lightbox) {
      lightbox.addEventListener('click', (e) => {
        if(e.target === lightbox) {
          lightbox.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Keyboard navigation for lightbox
    document.addEventListener('keydown', (e) => {
      if(lightbox && lightbox.getAttribute('aria-hidden') === 'false') {
        if(e.key === 'Escape') {
          lightbox.setAttribute('aria-hidden', 'true');
        } else if(e.key === 'ArrowLeft') {
          showSlide(currentSlide - 1);
        } else if(e.key === 'ArrowRight') {
          showSlide(currentSlide + 1);
        }
      }
    });

    // Initialize first slide
    showSlide(0);
  })();

});

