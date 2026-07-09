document.addEventListener("DOMContentLoaded", function () {
  // Fail silently if the CDN bundle didn't load. For reduced-motion users
  // keep the constellation but freeze it: a static texture respects the
  // preference without losing the visual identity.
  if (typeof tsParticles === "undefined") return;
  // The home page ships its own richer hero layer (#particles-js + career
  // topology); don't stack a second fullscreen system on top of it.
  if (document.getElementById("particles-js")) return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tsParticles.load("tsparticles", {
    fpsLimit: 60,
    fullScreen: {
      enable: true,
      zIndex: -1
    },
    background: {
      color: "transparent",
    },
    interactivity: {
      events: {
        onClick: {
          enable: false,
          mode: "push",
        },
        onHover: {
          enable: !reduced,
          mode: "grab",
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 140,
          links: {
            opacity: 0.35,
            color: "#58C4DD"
          },
        },
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: "#58C4DD", // 3B1B Cyan
      },
      links: {
        color: "#dbeafe", // Faint white-blue
        distance: 150,
        enable: true,
        opacity: 0.15,
        width: 1,
      },
      collisions: {
        enable: false,
      },
      move: {
        direction: "none",
        enable: !reduced,
        outModes: {
          default: "bounce",
        },
        random: false,
        speed: 0.6,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 45, // Subtle, not too dense
      },
      opacity: {
        value: 0.4,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 2 },
      },
    },
    detectRetina: true,
  });
});
