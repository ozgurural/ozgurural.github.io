document.addEventListener("DOMContentLoaded", function () {
  // Fail silently if the CDN bundle didn't load. For reduced-motion users
  // keep the constellation but freeze it: a static texture respects the
  // preference without losing the visual identity.
  if (typeof tsParticles === "undefined") return;
  // The home page runs the identical field via its own hero layer
  // (#particles-js + career topology); don't stack a second system on top.
  if (document.getElementById("particles-js")) return;
  // Shared config guarantees this field is identical to the home hero's.
  if (typeof window.buildParticleOptions !== "function") return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tsParticles.load("tsparticles", window.buildParticleOptions(reduced));
});
