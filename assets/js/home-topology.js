document.addEventListener("DOMContentLoaded", function() {
    // 1. Initialize tsParticles
    if (typeof tsParticles !== "undefined") {
        tsParticles.load("particles-js", {
            fpsLimit: 60,
            detectRetina: true,
            particles: {
                number: { value: 80, density: { enable: true, area: 900 } },
                color: { value: "#00f2fe" },
                shape: { type: "circle" },
                opacity: {
                    value: { min: 0.2, max: 0.5 },
                    animation: { enable: true, speed: 1, minimumValue: 0.1, sync: false }
                },
                size: {
                    value: { min: 1, max: 3 },
                    animation: { enable: true, speed: 2, minimumValue: 0.5, sync: false }
                },
                links: {
                    enable: true,
                    distance: 150,
                    color: "#00f2fe",
                    opacity: 0.3,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 0.8,
                    direction: "none",
                    outModes: { default: "bounce" }
                }
            },
            interactivity: {
                events: {
                    onHover: { enable: true, mode: "grab" },
                    resize: true
                },
                modes: {
                    grab: { distance: 200, links: { opacity: 0.6 } }
                }
            }
        });
    }

    // 2. Build SVG Topology
    const ARCH_LAYOUT = {
        'metu':     { x: 10, y: 50, label: 'METU' },
        'stm':      { x: 35, y: 25, label: 'STM (UAVs)' },
        'havelsan': { x: 35, y: 75, label: 'Havelsan (DLP)' },
        'avion':    { x: 65, y: 25, label: 'Avion (Simulators)' },
        'erau':     { x: 65, y: 75, label: 'ERAU (Ph.D.)' },
        'mlsec':    { x: 90, y: 50, label: 'Trustworthy ML' }
    };

    const ARCH_CONNS = [
        { from: 'metu', to: 'stm', color: 'rgba(34,211,238,0.5)' },
        { from: 'metu', to: 'havelsan', color: 'rgba(34,211,238,0.5)' },
        { from: 'stm', to: 'avion', color: '#10b981' },
        { from: 'havelsan', to: 'erau', color: 'rgba(34,211,238,0.5)' },
        { from: 'erau', to: 'mlsec', color: '#f43f5e' },
        { from: 'avion', to: 'mlsec', color: '#f59e0b' }
    ];

    const container = document.getElementById("topology-container");
    if (!container) return;

    // Create SVG Canvas
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    
    // Add Marker Defs
    const defs = document.createElementNS(svgNS, "defs");
    ARCH_CONNS.forEach((conn, i) => {
        const marker = document.createElementNS(svgNS, "marker");
        marker.setAttribute("id", "arrow-" + i);
        marker.setAttribute("viewBox", "0 0 10 10");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "5");
        marker.setAttribute("markerWidth", "6");
        marker.setAttribute("markerHeight", "6");
        marker.setAttribute("orient", "auto-start-reverse");
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        path.setAttribute("fill", conn.color);
        marker.appendChild(path);
        defs.appendChild(marker);
    });
    svg.appendChild(defs);
    container.appendChild(svg);

    function buildBezier(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1);
        const cpOffset = dx * 0.4;
        return `M ${x1},${y1} C ${x1 + cpOffset},${y1} ${x2 - cpOffset},${y2} ${x2},${y2}`;
    }

    // Render nodes and connections on resize to match absolute coords
    function render() {
        svg.innerHTML = '';
        svg.appendChild(defs);
        const rect = container.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        // Draw connections
        ARCH_CONNS.forEach((conn, i) => {
            const fromP = ARCH_LAYOUT[conn.from];
            const toP = ARCH_LAYOUT[conn.to];
            if(!fromP || !toP) return;

            const x1 = (fromP.x / 100) * w;
            const y1 = (fromP.y / 100) * h;
            const x2 = (toP.x / 100) * w;
            const y2 = (toP.y / 100) * h;

            const pathD = buildBezier(x1, y1, x2, y2);

            // Base path
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", pathD);
            path.setAttribute("class", "arch-conn");
            path.setAttribute("stroke", "rgba(148, 163, 184, 0.15)");
            path.setAttribute("marker-end", `url(#arrow-${i})`);
            svg.appendChild(path);

            // Animated trace
            const trace = document.createElementNS(svgNS, "path");
            trace.setAttribute("d", pathD);
            trace.setAttribute("class", "arch-conn-trace");
            trace.setAttribute("stroke", conn.color);
            svg.appendChild(trace);
        });

        // Ensure nodes exist in DOM
        Object.keys(ARCH_LAYOUT).forEach((key, idx) => {
            let nodeEl = document.getElementById("node-" + key);
            if (!nodeEl) {
                nodeEl = document.createElement("div");
                nodeEl.id = "node-" + key;
                nodeEl.className = "arch-node";
                nodeEl.innerText = ARCH_LAYOUT[key].label;
                nodeEl.style.animationDelay = (idx * 0.1) + "s";
                container.appendChild(nodeEl);
            }
            nodeEl.style.left = ARCH_LAYOUT[key].x + "%";
            nodeEl.style.top = ARCH_LAYOUT[key].y + "%";
        });
    }

    render();
    window.addEventListener("resize", render);
});

    
