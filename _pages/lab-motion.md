---
permalink: /lab/motion-platform/
title: "CSS-3D Motion Platform: telemetry visualized"
description: "A lightweight, no-WebGL CSS-3D visualization of a Level D full-flight simulator motion platform, responding in real-time to Roll, Pitch, and Yaw parameters."
excerpt: "Ported from the Avion Control Engine (ACE), this pure CSS-3D visualization demonstrates how to render 6-DOF simulator rigs without heavy WebGL payloads."
sitemap: true
header:
  og_image: "lab-og/og-lab.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-motion" style="margin-top: 0;">
  <span class="ep-eyebrow">Avionics UI · Data Visualization</span>
  <p class="lab-card__lead">✈️ Full-flight simulators (Level D) ride on massive hexapod motion systems. To monitor these rigs in the <strong>Avion Control Engine (ACE)</strong>, I designed this lightweight 3D rig visualization. It uses absolutely zero WebGL or Three.js—it is entirely driven by native CSS 3D transforms (`rotateX`, `rotateY`, `translateZ`), keeping the frontend bundle minuscule and rendering at native 60fps on any device.</p>
  <div class="lab-card__usecase">
    <strong>Infrastructure Port:</strong>
    <span>This component was directly ported from the `ace-main` SvelteKit production codebase, demonstrating the UI/UX capabilities of the Avion Instructor Operating Station.</span>
  </div>

  <div class="motion-wrap">
    <div class="motion-scene">
        <div class="motion-rig">
            <div class="motion-base"></div>
            <div class="motion-post"></div>
            <div class="motion-platform" id="motion-platform">
                <div class="motion-grid"></div>
                <div class="motion-heading"></div>
            </div>
        </div>
    </div>
    
    <div class="motion-controls">
        <div class="motion-control-group">
            <label for="motion-roll">Roll</label>
            <input type="range" id="motion-roll" min="-45" max="45" value="0" step="0.5">
            <span class="val" id="motion-roll-val">0.0°</span>
        </div>
        <div class="motion-control-group">
            <label for="motion-pitch">Pitch</label>
            <input type="range" id="motion-pitch" min="-45" max="45" value="0" step="0.5">
            <span class="val" id="motion-pitch-val">0.0°</span>
        </div>
        <div class="motion-control-group">
            <label for="motion-yaw">Yaw</label>
            <input type="range" id="motion-yaw" min="-180" max="180" value="0" step="1">
            <span class="val" id="motion-yaw-val">0.0°</span>
        </div>
    </div>
  </div>

  <details class="lab-reveal" open>
    <summary>🚀 How it works</summary>
    <p><strong>Pure CSS 3D:</strong> The component is housed in a container with `perspective: 1000px`. The platform elements use `transform-style: preserve-3d`. The central piston uses `translateZ(76px)` to stand up, and the main platform sits on top of it.</p>
    <p><strong>Hardware Acceleration:</strong> Because the sliders only update the `transform` property of the `motion-platform` element, the browser hands the rendering completely over to the GPU. This avoids layout thrashing and ensures smooth performance even when receiving UDP telemetry packets at 60Hz from the simulator.</p>
    <p><strong>Clamped Visuals:</strong> Notice that while the sliders (and numerical readouts) allow extreme values, the visual rotation of the platform is clamped to `±25°` using `Math.min()`. This is a UX decision from the ACE platform: it prevents erroneous sensor spikes from flipping the 3D rig completely upside down, ensuring the UI remains readable while still conveying that an extreme motion is occurring.</p>
  </details>
</section>

<script defer src="{{ '/assets/js/lab-films/motion-platform.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
