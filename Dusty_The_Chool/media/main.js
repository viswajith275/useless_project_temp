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
      window.vacuumAudio.ensureContext();
    }
  }

  window.addEventListener('click', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('focus', unlockAudio);
  window.addEventListener('mouseenter', unlockAudio);

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

      case 'customSounds':
        if (window.vacuumAudio && msg.soundsBaseUri) {
          window.vacuumAudio.initCustomSounds(msg.soundsBaseUri, msg.files || []);
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

    // Update State Badge and Panel Ambiance
    stateBadge.textContent = currentState.toUpperCase();
    stateBadge.className = 'state-badge ' + currentState;
    document.body.className = 'dusty-body state-' + currentState;
    if (appContainer) {
      appContainer.dataset.state = currentState;
    }

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
  const customSoundsAttr = document.body ? document.body.dataset.customSounds : '';
  const initialFiles = customSoundsAttr ? customSoundsAttr.split(',').filter(Boolean) : [];
  if (window.vacuumAudio && soundsUri) {
    window.vacuumAudio.initCustomSounds(soundsUri, initialFiles);
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

  function drawMurram(ctx, animTick, bagCount, currentState, rageMeter, isEnabled) {
    ctx.save();

    let murramX = 116;
    let murramY = 78;
    let murramAngle = 0;

    if (!isEnabled) {
      // Idle leaning
      murramX = 120;
      murramY = 82;
      murramAngle = 0.08;
    } else if (currentState === 'crashout' || rageMeter >= 90) {
      // Violent rattle
      murramX += (Math.random() * 6 - 3);
      murramY += (Math.random() * 4 - 2);
      murramAngle = (Math.random() * 0.3 - 0.15);
    } else if (currentState === 'tantrum' || rageMeter >= 65) {
      // Angry tremor
      murramX += Math.sin(animTick * 0.8) * 3;
      murramY += Math.cos(animTick * 0.8) * 1.5;
      murramAngle = Math.sin(animTick * 0.8) * 0.08;
    } else if (currentState === 'mischief') {
      // Hopping forward in mischievous conspiracy
      murramX = 104 + Math.sin(animTick * 0.5) * 3;
      murramY = 75 + Math.cos(animTick * 0.5) * 2;
      murramAngle = -0.22 + Math.sin(animTick * 0.5) * 0.06;
    } else if (currentState === 'hunger') {
      // Trembling slightly in hungry anticipation
      murramX = 110 + Math.sin(animTick * 0.25) * 2;
      murramY = 77 + Math.sin(animTick * 0.25) * 1.5;
      murramAngle = -0.1 + Math.sin(animTick * 0.25) * 0.04;
    } else if (currentState === 'eating' || currentState === 'approaching') {
      // Eagerly tilted forward toward broom mouth
      murramX = 108 + Math.sin(animTick * 0.3) * 2;
      murramY = 76 + Math.cos(animTick * 0.3) * 1.5;
      murramAngle = -0.16 + Math.sin(animTick * 0.3) * 0.05;
    } else if (currentState === 'clogged') {
      // Overloaded tremor
      murramY = 80 + Math.sin(animTick * 0.3) * 2;
      murramAngle = 0.12;
    } else {
      // Idle rhythmic breathing
      murramY += Math.sin(animTick * 0.08 + 1.2) * 1.5;
      murramAngle = Math.sin(animTick * 0.05) * 0.04;
    }

    ctx.translate(murramX, murramY);
    ctx.rotate(murramAngle);

    // Murram Outer Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(14, 18, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bamboo Woven Base (Trapezoid mouth pointing left towards broom)
    // Left edge (mouth) is wider and open, right edge is narrower and backed
    ctx.fillStyle = '#d2a679'; // Warm woven bamboo
    ctx.beginPath();
    ctx.moveTo(0, 14);     // Bottom-left lip
    ctx.lineTo(28, 10);    // Bottom-right corner
    ctx.lineTo(28, -6);    // Top-right corner
    ctx.lineTo(0, -10);    // Top-left lip
    ctx.closePath();
    ctx.fill();

    // Woven Reed Grid Texture Lines
    ctx.strokeStyle = '#b37d4e';
    ctx.lineWidth = 1;
    // Horizontal bamboo strips
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(28, -3);
    ctx.moveTo(0, -2); ctx.lineTo(28, 0);
    ctx.moveTo(0, 2);  ctx.lineTo(28, 3);
    ctx.moveTo(0, 6);  ctx.lineTo(28, 7);
    ctx.moveTo(0, 10); ctx.lineTo(28, 9);
    ctx.stroke();

    // Vertical warp weaving lines
    ctx.strokeStyle = '#c49364';
    ctx.beginPath();
    ctx.moveTo(7, -9); ctx.lineTo(7, 13);
    ctx.moveTo(14, -8); ctx.lineTo(14, 12);
    ctx.moveTo(21, -7); ctx.lineTo(21, 11);
    ctx.stroke();

    // Raised Woven Bamboo Rim (Border on top, right, and bottom; left mouth is open)
    ctx.strokeStyle = '#6b4226'; // Dark reinforced cane rim
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(28, -6);
    ctx.lineTo(28, 10);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Inner rim highlight
    ctx.strokeStyle = '#8d5524';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1, -9);
    ctx.lineTo(27, -5);
    ctx.lineTo(27, 9);
    ctx.lineTo(1, 13);
    ctx.stroke();

    // Open mouth lip plate (front edge facing the broom)
    ctx.fillStyle = '#5c3818';
    ctx.fillRect(-2, -10, 2, 24);

    // Dust Crumbs Accumulated in Murram
    if (bagCount > 0) {
      const crumbColors = ['#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#2ecc71', '#e67e22'];
      const count = Math.min(25, bagCount * 5);
      for (let i = 0; i < count; i++) {
        // Deterministic pseudo-random placement inside murram bed
        const cx = 5 + ((i * 7 + 3) % 20);
        const cy = -5 + ((i * 11 + 5) % 16);
        ctx.fillStyle = crumbColors[i % crumbColors.length];
        ctx.fillRect(cx, cy, 2, 2);
      }

      // Overflow indicator if clogged
      if (currentState === 'clogged') {
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(26, -4 + Math.sin(animTick * 0.4) * 2, 3, 3);
        ctx.fillRect(24, 6 + Math.cos(animTick * 0.4) * 2, 3, 3);
      }
    }

    ctx.restore();
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
    } else if (currentState === 'mischief') {
      sweepAngle = Math.sin(animTick * 0.45) * 0.38;
      sweepX = Math.sin(animTick * 0.45) * 14;
      spawnParticle();
    } else if (currentState === 'hunger') {
      sweepAngle = Math.sin(animTick * 0.15) * 0.22;
      sweepX = Math.sin(animTick * 0.15) * 8;
    } else {
      // Idle: gentle breathing sway
      sweepAngle = Math.sin(animTick * 0.06) * 0.07;
      sweepX = Math.sin(animTick * 0.06) * 3;
    }

    // --- 1. Draw Animated Kerala Murram (മുറം / Dustpan) ---
    drawMurram(ctx, animTick, bagCount, currentState, rageMeter, isEnabled);

    // --- 2. Draw Dust Particles flying into Murram ---
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      if (p.x > 130 || p.x < 30) {
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
    } else if (currentState === 'mischief') {
      bristleColor = animTick % 6 < 3 ? '#9b59b6' : '#8e44ad'; // Mischievous trickster purple
    } else if (currentState === 'hunger') {
      bristleColor = '#e67e22'; // Hungry fiery amber
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

    // Crisp, stable pixel-art bristle tips at bottom edge (no glitchy flickering)
    ctx.fillStyle = bristleColor;
    for (let bx = -22; bx < 22; bx += 2) {
      // Stable staggered pattern: 2px / 3px / 4px based purely on X coordinate
      const pattern = (Math.abs(bx) % 4 === 0) ? 4 : (Math.abs(bx) % 2 === 0 ? 3 : 2);
      ctx.fillRect(bx, 42, 2, pattern);
    }
    // Subtle shadow accent on bristle tips for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let bx = -22; bx < 22; bx += 4) {
      ctx.fillRect(bx, 44, 2, 2);
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
    } else if (currentState === 'hunger' || currentState === 'mischief') {
      // Sinister angled mischievous/threatening eyes
      ctx.fillStyle = currentState === 'mischief' ? '#ff0055' : '#f39c12';
      ctx.beginPath();
      ctx.moveTo(eye1X - 5, eyeY - 2);
      ctx.lineTo(eye1X + 4, eyeY + 1);
      ctx.lineTo(eye1X - 3, eyeY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(eye2X + 5, eyeY - 2);
      ctx.lineTo(eye2X - 4, eyeY + 1);
      ctx.lineTo(eye2X + 3, eyeY + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(eye1X - 1, eyeY, 2, 3);
      ctx.fillRect(eye2X - 1, eyeY, 2, 3);

      // Threatening / Mischievous Mouth
      if (currentState === 'hunger') {
        // Menacing hungry grin with sharp fangs
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(0, eyeY + 8, 4.5, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, eyeY + 8, 2, 2);
        ctx.fillRect(1, eyeY + 8, 2, 2);
      } else {
        // Sly lopsided smirk
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, eyeY + 11);
        ctx.quadraticCurveTo(0, eyeY + 13, 5, eyeY + 7);
        ctx.stroke();
      }
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
