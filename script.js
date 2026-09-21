const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Indicador de sección ---------- */
// Un punto por sección de <main>. La etiqueta sale del encabezado de la
// sección, así que se traduce sola al cambiar de idioma.
const dotsNav = document.querySelector(".section-dots");
const sections = [...document.querySelectorAll("main > section[id]")];

function labelFor(section) {
  // El antetítulo ("Sobre mí", "Experiencia"…) es la etiqueta más corta y ya
  // viene traducido. El hero no tiene uno útil, así que usa su h1.
  const h1 = section.querySelector("h1");
  if (h1) return h1.textContent.trim();
  const eyebrow = section.querySelector(".eyebrow");
  if (eyebrow) return eyebrow.textContent.trim();
  const h2 = section.querySelector("h2");
  return h2 ? h2.textContent.trim() : section.id;
}

if (dotsNav && sections.length) {
  sections.forEach((section) => {
    const dot = document.createElement("a");
    dot.className = "section-dot";
    dot.href = `#${section.id}`;
    dot.dataset.target = section.id;
    dot.innerHTML = '<span class="section-dot-label"></span>';
    dotsNav.append(dot);
  });

  const refreshLabels = () => {
    sections.forEach((section, i) => {
      const text = labelFor(section);
      const dot = dotsNav.children[i];
      dot.querySelector(".section-dot-label").textContent = text;
      dot.setAttribute("aria-label", text);
    });
  };
  refreshLabels();
  document.addEventListener("langchange", refreshLabels);

  // La sección activa es la que cruza una línea imaginaria a un tercio de la
  // pantalla: más estable que medir intersecciones cuando las secciones
  // tienen alturas muy distintas.
  const markActive = () => {
    const line = window.innerHeight / 3;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    [...dotsNav.children].forEach((dot) => {
      const isActive = dot.dataset.target === current.id;
      dot.classList.toggle("is-active", isActive);
      if (isActive) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      markActive();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  markActive();
}

/* ---------- Carrusel de proyectos ---------- */
// Se cuenta por "páginas" (un ancho visible del track), no por tarjetas: con
// tarjetas anchas la última nunca llega a alinearse con el borde izquierdo, así
// que un punto por tarjeta dejaría el último inalcanzable.
document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const dotsBox = carousel.querySelector(".carousel-dots");
  const buttons = [...carousel.querySelectorAll(".carousel-btn")];
  const controls = carousel.querySelector(".carousel-controls");
  if (!track || !track.children.length) return;

  const EPS = 2;
  const behavior = () => (prefersReduced.matches ? "auto" : "smooth");
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  const pageCount = () =>
    maxScroll() <= EPS ? 1 : Math.ceil(track.scrollWidth / track.clientWidth);

  function currentPage() {
    const max = maxScroll();
    const pages = pageCount();
    if (max <= EPS || pages < 2) return 0;
    return Math.round((track.scrollLeft / max) * (pages - 1));
  }

  function goToPage(page) {
    const pages = pageCount();
    const target = Math.max(0, Math.min(page, pages - 1));
    const left = pages < 2 ? 0 : (target / (pages - 1)) * maxScroll();
    track.scrollTo({ left, behavior: behavior() });
  }

  function buildDots() {
    const pages = pageCount();
    if (dotsBox.children.length === pages) return;
    dotsBox.replaceChildren();
    for (let i = 0; i < pages; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", String(i + 1));
      dot.addEventListener("click", () => goToPage(i));
      dotsBox.append(dot);
    }
  }

  function sync() {
    buildDots();
    const active = currentPage();
    [...dotsBox.children].forEach((dot, i) => {
      dot.classList.toggle("is-active", i === active);
      dot.setAttribute("aria-current", i === active ? "true" : "false");
    });

    const max = maxScroll();
    // Sin desbordamiento (pantallas muy anchas) los controles no pintan nada.
    controls.hidden = max <= EPS;
    buttons.forEach((btn) => {
      const forward = btn.dataset.dir === "1";
      btn.disabled = forward ? track.scrollLeft >= max - EPS : track.scrollLeft <= EPS;
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => goToPage(currentPage() + Number(btn.dataset.dir)));
  });

  track.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    goToPage(currentPage() + (e.key === "ArrowRight" ? 1 : -1));
  });

  let ticking = false;
  track.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sync();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", sync);
  sync();
});

/* ---------- Animaciones de entrada ---------- */
const groups = [".cards-grid", ".logros-grid", ".edu-grid", ".timeline", ".about-side"];
groups.forEach((sel) => {
  document.querySelectorAll(sel).forEach((group) => {
    group.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`;
    });
  });
});

const reveals = document.querySelectorAll(".reveal");

if (prefersReduced.matches) {
  reveals.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  reveals.forEach((el) => io.observe(el));
}

/* ---------- Scroll suave en los enlaces internos ---------- */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReduced.matches ? "auto" : "smooth",
      block: "start",
    });
  });
});
