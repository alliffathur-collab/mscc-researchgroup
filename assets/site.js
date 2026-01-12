(() => {
  const DOCX_PATH = "Research%20Group%20Website%202025.docx";

  const statusEl = document.getElementById("docx-status");
  const contentEl = document.getElementById("docx-content");
  const tocEl = document.getElementById("toc");
  const yearEl = document.getElementById("year");
  const headerEl = document.getElementById("mainHeader");
  const hamburgerEl = document.getElementById("hamburger");
  const navMenuEl = document.getElementById("navMenu");

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const setStatus = (text, kind = "info") => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.kind = kind;
  };

  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || "section";
  };

  const buildTOC = (root) => {
    if (!tocEl) return;

    const headings = Array.from(root.querySelectorAll("h1, h2"));
    const used = new Map();

    tocEl.innerHTML = "";

    if (headings.length === 0) {
      tocEl.innerHTML = '<span class="toc-row__empty">No headings detected in the DOCX.</span>';
      return;
    }

    for (const h of headings) {
      const text = (h.textContent || "").trim();
      if (!text) continue;

      let id = slugify(text);
      const count = used.get(id) || 0;
      used.set(id, count + 1);
      if (count > 0) id = `${id}-${count + 1}`;

      if (!h.id) h.id = id;

      const a = document.createElement("a");
      a.href = `#${h.id}`;
      a.textContent = text;
      tocEl.appendChild(a);
    }
  };

  const initHeader = () => {
    if (!headerEl) return;

    const setHeaderHeightVar = () => {
      document.documentElement.style.setProperty("--header-h", `${headerEl.offsetHeight}px`);
    };

    const onScroll = () => {
      if (window.pageYOffset > 50) headerEl.classList.add("scrolled");
      else headerEl.classList.remove("scrolled");
      setHeaderHeightVar();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", setHeaderHeightVar);
    setHeaderHeightVar();
    onScroll();

    if (hamburgerEl && navMenuEl) {
      const closeMenu = () => {
        navMenuEl.classList.remove("open");
        hamburgerEl.setAttribute("aria-expanded", "false");
      };

      hamburgerEl.addEventListener("click", () => {
        const isOpen = navMenuEl.classList.toggle("open");
        hamburgerEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      navMenuEl.addEventListener("click", (e) => {
        const link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
        if (link) closeMenu();
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
      });
    }
  };

  const initActiveNav = () => {
    const navLinks = document.querySelectorAll('.menu a[href^="#"]');
    const sections = document.querySelectorAll('section[id]');
    if (navLinks.length === 0 || sections.length === 0 || !headerEl) return;

    const highlightNav = () => {
      let current = "";
      const headerHeight = headerEl.offsetHeight;

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - headerHeight - 60;
        if (window.pageYOffset >= sectionTop) current = section.getAttribute("id") || "";
      });

      navLinks.forEach((link) => {
        link.removeAttribute("aria-current");
        if (link.getAttribute("href") === `#${current}`) link.setAttribute("aria-current", "page");
      });
    };

    window.addEventListener("scroll", highlightNav, { passive: true });
    highlightNav();
  };

  const renderDocx = async () => {
    if (!contentEl) return;

    // Wait for mammoth to load (from CDN)
    const hasMammoth = () => typeof window.mammoth !== "undefined";

    for (let i = 0; i < 60 && !hasMammoth(); i++) {
      // ~3s total
      await new Promise((r) => setTimeout(r, 50));
    }

    if (!hasMammoth()) {
      setStatus("Could not load DOCX renderer library (mammoth).", "error");
      contentEl.innerHTML =
        '<p style="color: rgba(255,255,255,0.7)">DOCX rendering failed: mammoth did not load. Check your network and try again.</p>';
      return;
    }

    try {
      setStatus("Fetching DOCX content…");
      const res = await fetch(DOCX_PATH, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to fetch DOCX (${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();

      setStatus("Rendering document…");
      const result = await window.mammoth.convertToHtml({ arrayBuffer });

      const wrapper = document.createElement("div");
      wrapper.innerHTML = result.value || "";

      // Basic hardening: strip script tags if any were produced.
      wrapper.querySelectorAll("script").forEach((n) => n.remove());

      contentEl.innerHTML = "";
      contentEl.appendChild(wrapper);

      buildTOC(contentEl);

      const warnings = (result.messages || []).filter((m) => m.type === "warning");
      if (warnings.length > 0) {
        setStatus(`Loaded (with ${warnings.length} formatting warning(s)).`);
      } else {
        setStatus("Loaded successfully.");
      }
    } catch (err) {
      setStatus("Failed to load DOCX content.", "error");
      const message = err && typeof err === "object" && "message" in err ? err.message : String(err);
      contentEl.innerHTML = `<p style="color: rgba(255,255,255,0.7)">DOCX rendering failed: ${message}. Ensure the DOCX exists in the repository root.</p>`;
      if (tocEl) tocEl.innerHTML = '<div class="toc__empty">TOC unavailable.</div>';
    }
  };

  // Smooth-scroll for in-page anchors (with fixed-header offset)
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const link = target.closest('a[href^="#"]');
    if (!(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    const el = document.querySelector(href);
    if (!el) return;

    e.preventDefault();

    const headerOffset = headerEl ? headerEl.offsetHeight + 16 : 0;
    const y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    history.pushState(null, "", href);
  });

  initHeader();
  initActiveNav();
  renderDocx();
})();
