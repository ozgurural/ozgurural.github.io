document.addEventListener('DOMContentLoaded', function() {
    const platform = document.getElementById('motion-platform');
    const rollInput = document.getElementById('motion-roll');
    const pitchInput = document.getElementById('motion-pitch');
    const yawInput = document.getElementById('motion-yaw');
    const rollVal = document.getElementById('motion-roll-val');
    const pitchVal = document.getElementById('motion-pitch-val');
    const yawVal = document.getElementById('motion-yaw-val');

    if (!platform) return;

    function updatePlatform() {
        // Cap the visual tilt
        const rawR = parseFloat(rollInput.value);
        const rawP = parseFloat(pitchInput.value);
        const rawY = parseFloat(yawInput.value);

        const r = Math.max(-25, Math.min(25, rawR));
        const p = Math.max(-25, Math.min(25, rawP));
        const y = rawY;

        // Apply CSS 3D transform
        // translateZ(76px) is the height of the post
        // rotateX is pitch, rotateY is roll, rotateZ is yaw
        platform.style.transform = `translateZ(76px) rotateX(${-p}deg) rotateY(${r}deg) rotateZ(${-y}deg)`;

        // Update labels
        rollVal.textContent = rawR.toFixed(1) + '°';
        pitchVal.textContent = rawP.toFixed(1) + '°';
        yawVal.textContent = rawY.toFixed(1) + '°';
    }

    rollInput.addEventListener('input', updatePlatform);
    pitchInput.addEventListener('input', updatePlatform);
    yawInput.addEventListener('input', updatePlatform);

    // Init
    updatePlatform();
});
