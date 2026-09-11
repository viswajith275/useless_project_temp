(function () {
  const vscode = acquireVsCodeApi();

  // Elements
  const canvas = document.getElementById('dustyCanvas');
  const ctx = canvas.getContext('2d');
  const stateBadge = document.getElementById('stateBadge');
  const speechBubble = document.getElementById('speechBubble');
  const bagValue = document.getElementById('bagValue');
  const bagBar = document.getElementById('bagBar');
  const targetCard = document.getElementById('targetCard');
  const targetDesc = document.getElementById('targetDesc');
  const appContainer = document.getElementById('appContainer');

  // Buttons
  const btnEngine = document.getElementById('btnEngine');
  const btnEngineText = document.getElementById('btnEngineText');
  const btnUnclog = document.getElementById('btnUnclog');
  const btnFeed = document.getElementById('btnFeed');
  const btnInsult = document.getElementById('btnInsult');
  const btnMute = document.getElementById('btnMute');
  const btnMuteText = document.getElementById('btnMuteText');
  const muteIcon = document.getElementById('muteIcon');
  const btnProblems = document.getElementById('btnProblems');

  // Animation State
  let currentState = 'idle';
  let isEnabled = true;
  let isMuted = false;
  let bagCount = 0;
  let bagCapacity = 5;
  let animTick = 0;
  let particles = [];

  // Unlock Web Audio on user gesture
  function unlockAudio() {
    if (window.vacuumAudio) {
      const audioCtx = window.vacuumAudio.ensureContext();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }
  }

  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  // Event Listeners for Buttons
  btnEngine.addEventListener('click', () => {
    unlockAudio();
    vscode.postMessage({ type: 'toggleEngine' });
  });

  btnUnclog.addEventListener('click', () => {
    unlockAudio();
    vscode.postMessage({ type: 'unclog' });
  });

  btnFeed.addEventListener('click', () => {
    unlockAudio();
    vscode.postMessage({ type: 'feed' });
  });

  btnInsult.addEventListener('click', () => {
    unlockAudio();
    vscode.postMessage({ type: 'insult' });
  });

  btnMute.addEventListener('click', () => {
    unlockAudio();
    vscode.postMessage({ type: 'mute' });
  });

  btnProblems.addEventListener('click', () => {
    vscode.postMessage({ type: 'openProblems' });
  });

  // Handle incoming messages from extension host
  window.addEventListener('message', event => {
    const msg = event.data;
    if (!msg || !msg.type) {
      return;
    }

    switch (msg.type) {
      case 'state':
        updateState(msg.state);
        break;

      case 'roast':
        speechBubble.textContent = `"${msg.text}"`;
        break;

      case 'bag':
        updateBag(msg.value, msg.capacity);
        break;

      case 'target':
        updateTarget(msg.target);
        break;

      case 'sound':
        if (window.vacuumAudio) {
          window.vacuumAudio.play(msg.name);
        }
        break;

      case 'shake':
        triggerShake();
        break;
    }
  });

  function updateState(stateSnapshot) {
    if (!stateSnapshot) {
      return;
    }

    currentState = stateSnapshot.state;
    isEnabled = stateSnapshot.enabled;
    isMuted = stateSnapshot.muted;
    bagCount = stateSnapshot.bagCount;
    bagCapacity = stateSnapshot.bagCapacity;

    // Update State Badge
    stateBadge.textContent = currentState.toUpperCase();
    stateBadge.className = 'state-badge ' + currentState;

    // Engine Button Text
    btnEngineText.textContent = isEnabled ? 'STOP' : 'START';
    if (!isEnabled) {
      btnEngine.className = 'btn btn-secondary';
    } else {
      btnEngine.className = 'btn btn-primary';
    }

    // Audio Button State
    if (window.vacuumAudio) {
      window.vacuumAudio.setMuted(isMuted);
    }
    btnMuteText.textContent = isMuted ? 'UNMUTE' : 'MUTE';
    muteIcon.textContent = isMuted ? '🔇' : '🔊';

    // Unclog Button State
    if (currentState === 'clogged') {
      btnUnclog.className = 'btn btn-danger';
      triggerShake();
    } else {
      btnUnclog.className = 'btn btn-secondary';
    }

    updateBag(bagCount, bagCapacity);
    updateTarget(stateSnapshot.currentTarget);

    if (stateSnapshot.lastRoast) {
      speechBubble.textContent = `"${stateSnapshot.lastRoast}"`;
    }
  }

  function updateBag(count, capacity) {
    bagCount = count || 0;
    bagCapacity = capacity || 5;
    bagValue.textContent = `${bagCount} / ${bagCapacity}`;

    const percentage = Math.min(100, Math.round((bagCount / bagCapacity) * 100));
    bagBar.style.width = percentage + '%';

    bagBar.className = 'progress-bar-fill';
    if (percentage >= 100) {
      bagBar.classList.add('full');
    } else if (percentage >= 60) {
      bagBar.classList.add('warning');
    }
  }

  function updateTarget(target) {
    if (target && target.message) {
      targetCard.style.display = 'block';
      targetDesc.textContent = `L${target.line + 1}: ${target.message}`;
    } else {
      targetCard.style.display = 'none';
    }
  }

  function triggerShake() {
    appContainer.classList.remove('shake');
    void appContainer.offsetWidth; // Trigger reflow
    appContainer.classList.add('shake');
    setTimeout(() => {
      appContainer.classList.remove('shake');
    }, 300);
  }

  // --- Canvas Rendering Loop ---
  function spawnParticle() {
    if (particles.length < 15) {
      particles.push({
        x: 140 + Math.random() * 15,
        y: 65 + (Math.random() * 20 - 10),
        vx: -(2 + Math.random() * 3),
        vy: (Math.random() - 0.5) * 1.5,
        size: 2 + Math.random() * 2,
        color: ['#e74c3c', '#f1c40f', '#3498db', '#e67e22'][Math.floor(Math.random() * 4)]
      });
    }
  }

  function draw() {
    animTick++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = 75;
    const centerY = 65;
    const bob = Math.sin(animTick * 0.08) * (isEnabled ? 2 : 0);

    // If eating, spawn intake particles
    if (currentState === 'eating' || currentState === 'approaching') {
      spawnParticle();
      spawnParticle();
    }

    // Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);

      // Despawn near nozzle
      if (p.x < centerX + 30) {
        particles.splice(i, 1);
      }
    }

    // 1. Wheels
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(centerX - 24, centerY + 24 + bob, 8, 0, Math.PI * 2);
    ctx.arc(centerX + 12, centerY + 24 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Wheel caps
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(centerX - 24, centerY + 24 + bob, 3, 0, Math.PI * 2);
    ctx.arc(centerX + 12, centerY + 24 + bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // 2. Canister Body
    let bodyColor = '#e74c3c'; // Default Crimson
    if (!isEnabled) {
      bodyColor = '#7f8c8d';
    } else if (currentState === 'clogged') {
      bodyColor = '#8e44ad';
    } else if (currentState === 'tantrum') {
      bodyColor = animTick % 6 < 3 ? '#c0392b' : '#f39c12';
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(centerX - 35, centerY - 20 + bob, 56, 40, [14, 18, 8, 8]);
    ctx.fill();

    // Canister highlight stripe
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(centerX - 30, centerY - 14 + bob, 46, 6);

    // 3. Suction Hose & Nozzle
    ctx.lineWidth = 4;
    ctx.strokeStyle = isEnabled ? '#bdc3c7' : '#95a5a6';
    ctx.beginPath();
    ctx.moveTo(centerX + 18, centerY + 4 + bob);

    const nozzleExtension = currentState === 'approaching' || currentState === 'eating'
      ? Math.sin(animTick * 0.3) * 6 + 25
      : 15;

    ctx.quadraticCurveTo(
      centerX + 30,
      centerY - 5 + bob,
      centerX + 18 + nozzleExtension,
      centerY + 8 + bob
    );
    ctx.stroke();

    // Nozzle tip
    ctx.fillStyle = currentState === 'eating' ? '#f1c40f' : '#34495e';
    ctx.beginPath();
    const tipX = centerX + 18 + nozzleExtension;
    const tipY = centerY + 8 + bob;
    ctx.ellipse(tipX, tipY, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Eyes & Facial Expression
    const eye1X = centerX - 14;
    const eye2X = centerX + 4;
    const eyeY = centerY - 4 + bob;

    if (!isEnabled) {
      // Sleeping Zzz
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(eye1X - 5, eyeY);
      ctx.lineTo(eye1X + 5, eyeY);
      ctx.moveTo(eye2X - 5, eyeY);
      ctx.lineTo(eye2X + 5, eyeY);
      ctx.stroke();

      ctx.fillStyle = '#95a5a6';
      ctx.font = '10px monospace';
      ctx.fillText('z', centerX + 18, centerY - 18 + Math.sin(animTick * 0.05) * 3);
      ctx.fillText('Z', centerX + 26, centerY - 25 + Math.sin(animTick * 0.05) * 3);
    } else if (currentState === 'clogged') {
      // Crossed eyes X X
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2;
      [eye1X, eye2X].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x - 4, eyeY - 4);
        ctx.lineTo(x + 4, eyeY + 4);
        ctx.moveTo(x + 4, eyeY - 4);
        ctx.lineTo(x - 4, eyeY + 4);
        ctx.stroke();
      });

      // Puffed cheeks
      ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
      ctx.beginPath();
      ctx.arc(centerX - 24, eyeY + 8, 4, 0, Math.PI * 2);
      ctx.arc(centerX + 14, eyeY + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal / Hunting / Eating Eyes
      const blink = animTick % 90 < 4;
      if (blink) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(eye1X - 5, eyeY);
        ctx.lineTo(eye1X + 5, eyeY);
        ctx.moveTo(eye2X - 5, eyeY);
        ctx.lineTo(eye2X + 5, eyeY);
        ctx.stroke();
      } else {
        // Eye whites
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eye1X, eyeY, 6, 0, Math.PI * 2);
        ctx.arc(eye2X, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Pupils looking toward nozzle / target
        let pupilOffsetX = 2;
        let pupilOffsetY = 0;
        if (currentState === 'hunting') {
          pupilOffsetX = Math.sin(animTick * 0.15) * 3;
        } else if (currentState === 'eating' || currentState === 'approaching') {
          pupilOffsetX = 3.5;
        }

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(eye1X + pupilOffsetX, eyeY + pupilOffsetY, 2.5, 0, Math.PI * 2);
        ctx.arc(eye2X + pupilOffsetX, eyeY + pupilOffsetY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mouth
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      if (currentState === 'eating') {
        // Wide open chomping mouth
        const chomp = (animTick % 10 < 5) ? 6 : 2;
        ctx.ellipse(centerX - 5, centerY + 8 + bob, 5, chomp, 0, 0, Math.PI * 2);
      } else {
        // Smug smile
        ctx.arc(centerX - 5, centerY + 6 + bob, 4, 0, Math.PI);
      }
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  // Start loop and notify host
  requestAnimationFrame(draw);
  vscode.postMessage({ type: 'ready' });
})();
