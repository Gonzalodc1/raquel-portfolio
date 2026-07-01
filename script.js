// Reveal on scroll + staggered timing within groups
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

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

// Smooth-scroll for in-page anchors
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
