(function () {
  const vscode = acquireVsCodeApi();

  // Elements
  const canvas = document.getElementById('dustyCanvas');
  const ctx = canvas.getContext('2d');
  const stateBadge = document.getElementById('stateBadge');
  const speechBubble = document.getElementById('speechBubble');
  const bagValue = document.getElementById('bagValue');
  const bagBar = document.getElementById('bagBar');
  const rageValue = document.getElementById('rageValue');
  const rageBar = document.getElementById('rageBar');
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
  let rageMeter = 0;
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

      case 'rage':
        updateRage(msg.value);
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
    rageMeter = stateSnapshot.rageMeter || 0;

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
    updateRage(rageMeter);
    updateTarget(stateSnapshot.currentTarget);

    if (stateSnapshot.lastRoast) {
      speechBubble.textContent = `"${stateSnapshot.lastRoast}"`;
    }
  }

  function updateRage(rage) {
    rageMeter = rage || 0;
    if (rageValue) {
      rageValue.textContent = `${rageMeter}%`;
    }
    if (rageBar) {
      rageBar.style.width = `${rageMeter}%`;
      if (rageMeter >= 75) {
        rageBar.classList.add('nuclear');
      } else {
        rageBar.classList.remove('nuclear');
      }
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

  // Initialize custom audio directory if provided
  const soundsUri = document.body ? document.body.dataset.soundsUri : null;
  if (window.vacuumAudio && soundsUri) {
    window.vacuumAudio.setSoundsBaseUri(soundsUri);
  }

  function spawnParticle() {
    if (particles.length < 16) {
      particles.push({
        x: 65 + (Math.random() * 20 - 10),
        y: 85 + (Math.random() * 12 - 6),
        vx: 1.5 + Math.random() * 2.5,
        vy: -(Math.random() * 1.5),
        size: 2 + Math.random() * 2,
        color: ['#e74c3c', '#f1c40f', '#3498db', '#e67e22', '#7f8c8d'][Math.floor(Math.random() * 5)]
      });
    }
  }

  function draw() {
    animTick++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = 75;
    const centerY = 58;
    const bob = Math.sin(animTick * 0.08) * (isEnabled ? 2 : 0);

    // Dynamic broom sweeping physics
    let sweepAngle = 0;
    let sweepX = 0;

    if (!isEnabled) {
      sweepAngle = 0.28; // Leaning against wall sleeping
    } else if (currentState === 'crashout' || rageMeter >= 90) {
      sweepAngle = Math.sin(animTick * 0.6) * 0.75;
      sweepX = Math.sin(animTick * 0.6) * 26;
      spawnParticle();
      spawnParticle();
    } else if (currentState === 'eating' || currentState === 'approaching') {
      sweepAngle = Math.sin(animTick * 0.3) * 0.42;
      sweepX = Math.sin(animTick * 0.3) * 18;
      spawnParticle();
      spawnParticle();
    } else if (currentState === 'clogged') {
      sweepAngle = 0.32; // Drooping under heavy dust load
    } else if (currentState === 'tantrum') {
      sweepAngle = Math.sin(animTick * 0.5) * 0.35;
      sweepX = Math.sin(animTick * 0.5) * 12;
    } else {
      // Idle: gentle breathing sway
      sweepAngle = Math.sin(animTick * 0.06) * 0.07;
      sweepX = Math.sin(animTick * 0.06) * 3;
    }

    // --- 1. Draw Dustpan (മുറം) on the floor at bottom right ---
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(115, 84 + bob * 0.5, 30, 4); // Dustpan bottom lip
    ctx.fillStyle = '#2980b9'; // Blue metal dustpan body
    ctx.beginPath();
    ctx.moveTo(115, 84 + bob * 0.5);
    ctx.lineTo(145, 84 + bob * 0.5);
    ctx.lineTo(142, 68 + bob * 0.5);
    ctx.lineTo(120, 68 + bob * 0.5);
    ctx.closePath();
    ctx.fill();
    // Dustpan handle
    ctx.fillStyle = '#34495e';
    ctx.fillRect(142, 72 + bob * 0.5, 12, 3);

    // Dust accumulation in dustpan
    if (bagCount > 0) {
      ctx.fillStyle = '#7f8c8d';
      const dustHeight = Math.min(12, bagCount * 2.5);
      ctx.fillRect(122, 82 - dustHeight + bob * 0.5, 20, dustHeight);
    }

    // --- 2. Draw Dust Particles flying into Dustpan ---
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      if (p.x > 140 || p.x < 30) {
        particles.splice(i, 1);
      }
    }

    // --- 3. Draw Pixelated Broom (ചൂൽ) ---
    ctx.save();
    ctx.translate(centerX + sweepX, centerY + bob);
    ctx.rotate(sweepAngle);

    // A. Wooden Pole Handle (തടി പിടി)
    ctx.fillStyle = '#8d5524'; // Wood body
    ctx.fillRect(-3, -48, 6, 52);
    // Wood highlight on left
    ctx.fillStyle = '#b87333';
    ctx.fillRect(-3, -48, 2, 52);
    // Wood shadow on right
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(1, -48, 2, 52);
    // Red decorative handle grip at top
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(-4, -44, 8, 8);
    // Hanging loop
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-2, -51, 4, 4);

    // B. Twine Binding Cord (ചൂൽ കെട്ട്)
    ctx.fillStyle = '#d35400';
    ctx.fillRect(-8, 4, 16, 8);
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(-7, 6, 14, 2);
    ctx.fillRect(-7, 9, 14, 2);

    // C. Straw Bristles Body (ഈർക്കിലി / പൂ ചൂൽ)
    let bristleColor = '#f1c40f'; // Golden straw default
    if (!isEnabled) {
      bristleColor = '#95a5a6';
    } else if (currentState === 'crashout' || rageMeter >= 90) {
      const strobe = ['#ff0033', '#ff6600', '#ffff00', '#9b59b6'];
      bristleColor = strobe[Math.floor(animTick / 3) % strobe.length];
    } else if (rageMeter >= 65) {
      bristleColor = animTick % 6 < 3 ? '#e74c3c' : '#e67e22';
    } else if (rageMeter >= 35) {
      bristleColor = '#e67e22'; // Molten orange
    } else if (currentState === 'clogged') {
      bristleColor = '#8e44ad'; // Purple cobweb dust overload
    } else if (currentState === 'tantrum') {
      bristleColor = animTick % 6 < 3 ? '#c0392b' : '#f39c12';
    }

    ctx.fillStyle = bristleColor;
    ctx.beginPath();
    ctx.moveTo(-9, 12);
    ctx.lineTo(9, 12);
    ctx.lineTo(22, 42);
    ctx.lineTo(-22, 42);
    ctx.closePath();
    ctx.fill();

    // Bristle vertical striations / texture lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(-14, 16, 2, 24);
    ctx.fillRect(-6, 14, 2, 27);
    ctx.fillRect(2, 14, 2, 27);
    ctx.fillRect(10, 16, 2, 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(-10, 15, 2, 25);
    ctx.fillRect(-2, 14, 2, 27);
    ctx.fillRect(6, 15, 2, 25);

    // Jagged pixel tips at bottom edge of broom
    ctx.fillStyle = bristleColor;
    for (let bx = -22; bx < 22; bx += 3) {
      const spikeH = ((bx * 7 + animTick) % 4) + 3;
      ctx.fillRect(bx, 42, 2, spikeH);
    }

    // D. Expressive Pixel Eyes on the Broom Head
    const eye1X = -7;
    const eye2X = 7;
    const eyeY = 22;

    if (!isEnabled) {
      // Sleeping eyes - -
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(eye1X - 4, eyeY);
      ctx.lineTo(eye1X + 4, eyeY);
      ctx.moveTo(eye2X - 4, eyeY);
      ctx.lineTo(eye2X + 4, eyeY);
      ctx.stroke();

      ctx.fillStyle = '#95a5a6';
      ctx.font = '10px monospace';
      ctx.fillText('z', 16, -15 + Math.sin(animTick * 0.05) * 3);
      ctx.fillText('Z', 24, -22 + Math.sin(animTick * 0.05) * 3);
    } else if (currentState === 'clogged') {
      // Crossed eyes X X
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      [eye1X, eye2X].forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x - 3, eyeY - 3);
        ctx.lineTo(x + 3, eyeY + 3);
        ctx.moveTo(x + 3, eyeY - 3);
        ctx.lineTo(x - 3, eyeY + 3);
        ctx.stroke();
      });
      // Dizzy spirals / puffed cheeks
      ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
      ctx.beginPath();
      ctx.arc(-14, eyeY + 6, 3, 0, Math.PI * 2);
      ctx.arc(14, eyeY + 6, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const blink = animTick % 90 < 4;
      if (blink) {
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(eye1X - 4, eyeY);
        ctx.lineTo(eye1X + 4, eyeY);
        ctx.moveTo(eye2X - 4, eyeY);
        ctx.lineTo(eye2X + 4, eyeY);
        ctx.stroke();
      } else {
        // Eye whites (glow red at high rage)
        ctx.fillStyle = rageMeter >= 65 ? '#ff1111' : '#ffffff';
        ctx.beginPath();
        ctx.arc(eye1X, eyeY, 5, 0, Math.PI * 2);
        ctx.arc(eye2X, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Eye outline
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Pupils
        let pupilOffsetX = 1;
        let pupilOffsetY = 0;
        if (currentState === 'eating' || currentState === 'approaching') {
          pupilOffsetX = Math.sin(animTick * 0.3) * 2;
          pupilOffsetY = 1;
        } else if (currentState === 'hunting') {
          pupilOffsetX = Math.sin(animTick * 0.15) * 2.5;
        }

        ctx.fillStyle = rageMeter >= 65 ? '#ffff00' : '#2c3e50';
        ctx.beginPath();
        ctx.arc(eye1X + pupilOffsetX, eyeY + pupilOffsetY, 2.2, 0, Math.PI * 2);
        ctx.arc(eye2X + pupilOffsetX, eyeY + pupilOffsetY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mouth
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      if (currentState === 'eating') {
        const chomp = (animTick % 8 < 4) ? 5 : 2;
        ctx.ellipse(0, eyeY + 10, 4, chomp, 0, 0, Math.PI * 2);
      } else if (currentState === 'tantrum' || rageMeter >= 75) {
        // Angry grimace
        ctx.moveTo(-5, eyeY + 11);
        ctx.lineTo(5, eyeY + 9);
        ctx.lineTo(0, eyeY + 13);
        ctx.closePath();
      } else {
        // Smug smile
        ctx.arc(0, eyeY + 8, 3.5, 0, Math.PI);
      }
      ctx.fill();
    }

    ctx.restore();

    requestAnimationFrame(draw);
  }

  // Start loop and notify host
  requestAnimationFrame(draw);
  vscode.postMessage({ type: 'ready' });
})();
