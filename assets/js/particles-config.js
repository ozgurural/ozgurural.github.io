document.addEventListener("DOMContentLoaded", function () {
  // Fail silently if the CDN bundle didn't load. For reduced-motion users
  // keep the constellation but freeze it: a static texture respects the
  // preference without losing the visual identity.
  if (typeof tsParticles === "undefined") return;
  // Shared config renders one identical field on #tsparticles across every
  // page, including the home page.
  if (typeof window.buildParticleOptions !== "function") return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tsParticles.load("tsparticles", window.buildParticleOptions(reduced));
});
