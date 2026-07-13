// Single source of truth for the ambient constellation background.
//
// Every page must render an IDENTICAL particle field so the site feels like one
// continuous surface. Both consumers pull their options from here:
//   - particles-config.js -> #tsparticles  (all non-home pages)
//   - home-topology.js     -> #particles-js (home hero, plus career topology)
//
// Tuning notes: the twinkle (animated opacity + size) gives the field its
// "alive" quality; the calm speed and soft #58C4DD brand cyan keep it from
// competing with body text on content-heavy pages.
window.buildParticleOptions = function (reduced) {
  // Touch devices have no cursor, so the hover "grab" listener only burns CPU.
  var isTouch = window.matchMedia && window.matchMedia("(hover: none)").matches;
  return {
    fpsLimit: 60,
    detectRetina: true,
    fullScreen: {
      enable: true,
      zIndex: -1,
    },
    background: {
      color: "transparent",
    },
    particles: {
      number: {
        value: 55,
        density: { enable: true, area: 900 },
      },
      color: {
        value: "#58C4DD", // 3B1B brand cyan
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: { min: 0.2, max: 0.5 },
        // The gentle twinkle — disabled for reduced-motion users.
        animation: { enable: !reduced, speed: 1, minimumValue: 0.1, sync: false },
      },
      size: {
        value: { min: 1, max: 2.5 },
        animation: { enable: !reduced, speed: 2, minimumValue: 0.5, sync: false },
      },
      links: {
        enable: true,
        distance: 150,
        color: "#58C4DD",
        opacity: 0.2,
        width: 1,
      },
      collisions: {
        enable: false,
      },
      move: {
        enable: !reduced,
        speed: 0.6,
        direction: "none",
        random: false,
        straight: false,
        outModes: { default: "bounce" },
      },
    },
    interactivity: {
      events: {
        onHover: { enable: !reduced && !isTouch, mode: "grab" },
        onClick: { enable: false, mode: "push" },
        resize: true,
      },
      modes: {
        grab: {
          distance: 160,
          links: { opacity: 0.5, color: "#58C4DD" },
        },
        push: { quantity: 4 },
      },
    },
  };
};
