document.addEventListener("DOMContentLoaded", function () {
  // Fail silently if the CDN bundle didn't load. For reduced-motion users
  // keep the constellation but freeze it: a static texture respects the
  // preference without losing the visual identity.
  if (typeof tsParticles === "undefined") return;
  // Shared config renders one identical field on #tsparticles across every
  // page, including the home page.
  if (typeof window.buildParticleOptions !== "function") return;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var loaded = tsParticles.load("tsparticles", window.buildParticleOptions(reduced));
  if (!loaded || typeof loaded.then !== "function") return;

  loaded.then(function (container) {
    // If #tsparticles has no size when the engine initialises, tsParticles
    // builds a 0x0 canvas holding zero particles and never recovers by itself:
    // the box growing does not bring it back and neither does a window resize,
    // only an explicit refresh. That state looks exactly like a frozen
    // background, because there is nothing on the canvas to animate. It
    // happens whenever layout is not ready at DOMContentLoaded: a page opened
    // in a background tab, a restored session, a bfcache navigation.
    //
    // So watch for the box acquiring a size and repair once. Several signals
    // are used because no single one is reliable: ResizeObserver callbacks are
    // delivered with the frame, so a tab that never renders never fires one.
    if (!container) return;
    var host = document.getElementById("tsparticles");
    if (!host) return;

    var done = false;
    function repairIfCollapsed() {
      if (done || container.destroyed) return;
      var box = host.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;            // no size yet, wait
      var size = container.canvas && container.canvas.size;
      if (size && size.width > 0 && size.height > 0) {        // healthy
        done = true;
        return;
      }
      done = true;
      container.refresh();
    }

    repairIfCollapsed();
    if (done) return;

    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(function () {
        repairIfCollapsed();
        if (done) ro.disconnect();
      });
      ro.observe(host);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) repairIfCollapsed();
    });
    window.addEventListener("pageshow", repairIfCollapsed);
    window.addEventListener("resize", repairIfCollapsed);
  });
});
