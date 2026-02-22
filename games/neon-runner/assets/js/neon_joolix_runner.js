/* ============================================
   NEON JOOLIX RUNNER - ISOLATED JAVASCRIPT
   Namespace: NeonJoolixRunner
   ============================================ */

const NeonJoolixRunner = (function() {
  'use strict';

  // ============================================
  // PRIVATE VARIABLES
  // ============================================

  let canvas = null;
  let ctx = null;
  let joolixSprite = null;

  // Game Configuration
  const CONFIG = {
    gravity: 0.6,
    speedIncrement: 0.004,
    obstacleFrequency: 1500,
    initialSpeed: 6,
    maxSpeed: 16,
    jumpForce: -12,
    groundHeight: 30
  };

  // Game timing
  let gameStartTime = null;
  let gameEndTime = null;
  let totalPausedTime = 0;
  let pauseStartTime = null;

  // Game State
  let gameState = 'ready';
  let score = 0;
  let highScore = 0;
  let currentSpeed = CONFIG.initialSpeed;
  let lastObstacleTime = 0;
  let animationId = null;

  // Game objects
  let joolix = null;
  let obstacles = [];
  let particles = [];
  let groundOffset = 0;

  // DOM Elements cache
  let elements = {};

  // ============================================
  // PRIVATE CLASSES
  // ============================================

  // Joolix class (Main Character)
  class Joolix {
    constructor() {
      this.width = 50;
      this.height = 55;
      this.x = 50;
      this.y = canvas.height - CONFIG.groundHeight - this.height;
      this.groundY = this.y;
      this.velocityY = 0;
      this.isJumping = false;
      this.isDucking = false;
      this.frameCount = 0;
      this.legPhase = 0;
    }

    jump() {
      if (!this.isJumping && !this.isDucking) {
        this.velocityY = CONFIG.jumpForce;
        this.isJumping = true;
      }
    }

    duck(state) {
      if (!this.isJumping) {
        this.isDucking = state;
        if (state) {
          this.height = 30;
          this.y = this.groundY + 25;
        } else {
          this.height = 55;
          this.y = this.groundY;
        }
      }
    }

    update() {
      if (this.isJumping) {
        this.velocityY += CONFIG.gravity;
        this.y += this.velocityY;

        const groundLevel = this.isDucking ? this.groundY + 25 : this.groundY;
        if (this.y >= groundLevel) {
          this.y = groundLevel;
          this.isJumping = false;
          this.velocityY = 0;
        }
      }

      this.frameCount++;
      if (this.frameCount % 6 === 0) {
        this.legPhase = (this.legPhase + 1) % 2;
      }
    }

    draw() {
      ctx.save();

      ctx.shadowColor = '#00fff5';
      ctx.shadowBlur = 20;

      if (joolixSprite && joolixSprite.complete && joolixSprite.naturalHeight !== 0) {
        if (this.isDucking) {
          ctx.drawImage(joolixSprite, this.x, this.y, this.width + 15, this.height);
        } else {
          const bounce = this.isJumping ? 0 : Math.sin(this.frameCount * 0.15) * 2;
          ctx.drawImage(joolixSprite, this.x, this.y + bounce, this.width, this.height);
        }
      } else {
        this.drawFallback();
      }

      ctx.restore();
    }

    drawFallback() {
      const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
      gradient.addColorStop(0, '#00fff5');
      gradient.addColorStop(1, '#ff00ff');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#00fff5';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(this.x, this.y + 15, this.width - 8, this.height - 15, 4);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(this.x + 15, this.y, 28, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0a0a0f';
      ctx.beginPath();
      ctx.arc(this.x + 35, this.y + 8, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    getHitbox() {
      return {
        x: this.x + 8,
        y: this.y + 8,
        width: this.width - 16,
        height: this.height - 16
      };
    }
  }

  // Obstacle class
  class Obstacle {
    constructor(type) {
      this.type = type;
      this.x = canvas.width + 50;

      if (type === 'cactus') {
        this.width = 20 + Math.random() * 15;
        this.height = 35 + Math.random() * 25;
        this.y = canvas.height - CONFIG.groundHeight - this.height;
      } else if (type === 'doubleCactus') {
        this.width = 45;
        this.height = 40;
        this.y = canvas.height - CONFIG.groundHeight - this.height;
      } else if (type === 'bird') {
        this.width = 40;
        this.height = 30;
        this.y = canvas.height - CONFIG.groundHeight - 60 - Math.random() * 40;
        this.wingPhase = 0;
      }
    }

    update() {
      this.x -= currentSpeed;

      if (this.type === 'bird') {
        this.wingPhase = (this.wingPhase + 0.15) % (Math.PI * 2);
      }
    }

    draw() {
      ctx.save();
      ctx.shadowColor = '#ff6b35';
      ctx.shadowBlur = 10;

      const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      gradient.addColorStop(0, '#ff6b35');
      gradient.addColorStop(1, '#ff00ff');

      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 2;

      if (this.type === 'cactus') {
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff6b35';
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(this.x - 5, this.y + 10 + i * 12);
          ctx.lineTo(this.x, this.y + 15 + i * 12);
          ctx.lineTo(this.x - 5, this.y + 20 + i * 12);
          ctx.fill();
        }
      } else if (this.type === 'doubleCactus') {
        ctx.beginPath();
        ctx.roundRect(this.x, this.y + 5, 18, this.height - 5, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(this.x + 25, this.y, 20, this.height, 4);
        ctx.fill();
        ctx.stroke();
      } else if (this.type === 'bird') {
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 15, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + 40, this.y + 15);
        ctx.lineTo(this.x + 50, this.y + 18);
        ctx.lineTo(this.x + 40, this.y + 20);
        ctx.fill();

        ctx.fillStyle = '#0a0a0f';
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 12, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = gradient;
        const wingY = Math.sin(this.wingPhase) * 10;
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + 10);
        ctx.lineTo(this.x + 10, this.y - 5 + wingY);
        ctx.lineTo(this.x + 25, this.y + 10);
        ctx.fill();
      }

      ctx.restore();
    }

    getHitbox() {
      return {
        x: this.x + 3,
        y: this.y + 3,
        width: this.width - 6,
        height: this.height - 6
      };
    }
  }

  // Particle class
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = (Math.random() - 0.5) * 4;
      this.life = 1;
      this.decay = 0.02 + Math.random() * 0.02;
      this.size = 2 + Math.random() * 3;
      this.color = color;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, this.size * this.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ============================================
  // PRIVATE FUNCTIONS
  // ============================================

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const ratio = 800 / 300;
    const width = Math.min(wrapper.clientWidth, 800);
    canvas.style.width = width + 'px';
    canvas.style.height = (width / ratio) + 'px';
  }

  function drawBackground() {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0d0d15');
    bgGrad.addColorStop(0.5, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 255, 245, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 40;
    const offsetX = groundOffset % gridSize;

    for (let x = -offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawGround() {
    const groundY = canvas.height - CONFIG.groundHeight;

    ctx.strokeStyle = '#00fff5';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00fff5';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(canvas.width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0, 255, 245, 0.1)';
    for (let i = 0; i < canvas.width; i += 20) {
      const offset = (groundOffset + i) % (canvas.width + 100);
      const x = offset - 50;
      if (Math.random() > 0.7) {
        ctx.fillRect(x, groundY + 5, 3 + Math.random() * 5, 2);
      }
    }
  }

  function spawnObstacle() {
    const now = Date.now();
    if (now - lastObstacleTime > CONFIG.obstacleFrequency) {
      const types = ['cactus', 'cactus', 'doubleCactus', 'bird'];
      const type = types[Math.floor(Math.random() * types.length)];
      obstacles.push(new Obstacle(type));
      lastObstacleTime = now;
    }
  }

  function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  function createExplosion(x, y) {
    const colors = ['#00fff5', '#ff00ff', '#ff6b35', '#39ff14'];
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
  }

  function triggerCallback() {
    const finalScore = Math.floor(score / 10);

    let duration = 0;
    if (gameStartTime && gameEndTime) {
      duration = Math.floor((gameEndTime - gameStartTime - totalPausedTime) / 1000);
    }

    const gameData = {
      score: finalScore,
      duration: duration,
      settings: {
        gravity: CONFIG.gravity,
        speedIncrement: CONFIG.speedIncrement,
        obstacleFrequency: CONFIG.obstacleFrequency,
        initialSpeed: CONFIG.initialSpeed
      },
      timestamp: new Date().toISOString()
    };

    console.log('%c📊 Game Data for Callback:', 'color: #00fff5; font-size: 14px; font-weight: bold;');
    console.log('Score:', gameData.score);
    console.log('Duration:', gameData.duration, 'seconds');
    console.log('Settings:', gameData.settings);

    if (typeof neon_joolix_runner_callback === 'function') {
      try {
        neon_joolix_runner_callback(gameData);
      } catch (error) {
        console.error('Error in neon_joolix_runner_callback:', error);
      }
    } else {
      console.warn('neon_joolix_runner_callback function is not defined.');
      console.log('Define it like this:');
      console.log('function neon_joolix_runner_callback(data) { /* your code */ }');
    }
  }

  function gameLoop() {
    if (gameState !== 'playing') return;

    drawBackground();
    drawGround();

    groundOffset += currentSpeed;

    joolix.update();
    joolix.draw();

    spawnObstacle();

    obstacles = obstacles.filter(obs => {
      obs.update();
      obs.draw();

      if (checkCollision(joolix.getHitbox(), obs.getHitbox())) {
        createExplosion(joolix.x + joolix.width / 2, joolix.y + joolix.height / 2);
        gameOver();
        return false;
      }

      return obs.x > -obs.width;
    });

    particles = particles.filter(p => {
      p.update();
      p.draw();
      return p.life > 0;
    });

    score++;
    if (score % 10 === 0) {
      elements.score.textContent = Math.floor(score / 10);
    }

    if (currentSpeed < CONFIG.maxSpeed) {
      currentSpeed += CONFIG.speedIncrement;
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  function initGame() {
    joolix = new Joolix();
    obstacles = [];
    particles = [];
    score = 0;
    currentSpeed = CONFIG.initialSpeed;
    lastObstacleTime = Date.now();
    elements.score.textContent = '0';

    gameStartTime = null;
    gameEndTime = null;
    totalPausedTime = 0;
    pauseStartTime = null;
  }

  function gameOver() {
    gameState = 'gameover';
    cancelAnimationFrame(animationId);

    gameEndTime = Date.now();

    const finalScore = Math.floor(score / 10);
    elements.finalScore.textContent = finalScore;

    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem('neon_joolix_runner_highScore', highScore);
      elements.highScore.textContent = highScore;
    }

    elements.gameOverOverlay.classList.add('neon_joolix_runner_overlay--active');

    triggerCallback();
  }

  function startGame() {
    if (gameState === 'ready' || gameState === 'gameover') {
      initGame();
      gameState = 'playing';

      gameStartTime = Date.now();

      elements.startOverlay.classList.remove('neon_joolix_runner_overlay--active');
      elements.gameOverOverlay.classList.remove('neon_joolix_runner_overlay--active');
      elements.pauseOverlay.classList.remove('neon_joolix_runner_overlay--active');
      gameLoop();
    }
  }

  function togglePause() {
    if (gameState === 'playing') {
      gameState = 'paused';
      cancelAnimationFrame(animationId);

      pauseStartTime = Date.now();

      elements.pauseOverlay.classList.add('neon_joolix_runner_overlay--active');
    } else if (gameState === 'paused') {
      gameState = 'playing';

      if (pauseStartTime) {
        totalPausedTime += Date.now() - pauseStartTime;
        pauseStartTime = null;
      }

      elements.pauseOverlay.classList.remove('neon_joolix_runner_overlay--active');
      gameLoop();
    }
  }

  function restartGame() {
    cancelAnimationFrame(animationId);
    elements.startOverlay.classList.remove('neon_joolix_runner_overlay--active');
    elements.gameOverOverlay.classList.remove('neon_joolix_runner_overlay--active');
    elements.pauseOverlay.classList.remove('neon_joolix_runner_overlay--active');
    initGame();
    gameState = 'playing';

    gameStartTime = Date.now();

    gameLoop();
  }

  function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'ready') {
          startGame();
        } else if (gameState === 'gameover') {
          startGame();
        } else if (gameState === 'playing') {
          joolix.jump();
        } else if (gameState === 'paused') {
          togglePause();
        }
      }

      if (e.code === 'ArrowDown' && gameState === 'playing') {
        e.preventDefault();
        joolix.duck(true);
      }

      if (e.code === 'KeyP') {
        togglePause();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowDown') {
        joolix.duck(false);
      }
    });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameState === 'ready' || gameState === 'gameover') {
        startGame();
      } else if (gameState === 'playing') {
        joolix.jump();
      } else if (gameState === 'paused') {
        togglePause();
      }
    });

    elements.touchJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameState === 'playing') {
        joolix.jump();
      }
    });

    // Button controls
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.restartBtn.addEventListener('click', restartGame);

    // Settings sliders
    elements.gravitySlider.addEventListener('input', (e) => {
      CONFIG.gravity = parseFloat(e.target.value);
      elements.gravityValue.textContent = e.target.value;
    });

    elements.speedSlider.addEventListener('input', (e) => {
      CONFIG.speedIncrement = parseFloat(e.target.value);
      elements.speedValue.textContent = e.target.value;
    });

    elements.obstacleSlider.addEventListener('input', (e) => {
      CONFIG.obstacleFrequency = parseInt(e.target.value);
      elements.obstacleValue.textContent = e.target.value + 'ms';
    });

    elements.initSpeedSlider.addEventListener('input', (e) => {
      CONFIG.initialSpeed = parseFloat(e.target.value);
      elements.initSpeedValue.textContent = e.target.value;
    });

    // Window resize
    window.addEventListener('resize', resizeCanvas);
  }

  function cacheElements() {
    elements = {
      canvas: document.getElementById('neon_joolix_runner_canvas'),
      score: document.getElementById('neon_joolix_runner_score'),
      highScore: document.getElementById('neon_joolix_runner_highScore'),
      finalScore: document.getElementById('neon_joolix_runner_finalScore'),
      startOverlay: document.getElementById('neon_joolix_runner_startOverlay'),
      gameOverOverlay: document.getElementById('neon_joolix_runner_gameOverOverlay'),
      pauseOverlay: document.getElementById('neon_joolix_runner_pauseOverlay'),
      startBtn: document.getElementById('neon_joolix_runner_startBtn'),
      pauseBtn: document.getElementById('neon_joolix_runner_pauseBtn'),
      restartBtn: document.getElementById('neon_joolix_runner_restartBtn'),
      touchJump: document.getElementById('neon_joolix_runner_touchJump'),
      gravitySlider: document.getElementById('neon_joolix_runner_gravitySlider'),
      gravityValue: document.getElementById('neon_joolix_runner_gravityValue'),
      speedSlider: document.getElementById('neon_joolix_runner_speedSlider'),
      speedValue: document.getElementById('neon_joolix_runner_speedValue'),
      obstacleSlider: document.getElementById('neon_joolix_runner_obstacleSlider'),
      obstacleValue: document.getElementById('neon_joolix_runner_obstacleValue'),
      initSpeedSlider: document.getElementById('neon_joolix_runner_initSpeedSlider'),
      initSpeedValue: document.getElementById('neon_joolix_runner_initSpeedValue')
    };
  }

  // ============================================
  // PUBLIC API
  // ============================================

  return {
    init: function() {
      console.log('%c🎮 NEON JOOLIX RUNNER', 'font-size: 24px; font-weight: bold; color: #00fff5; text-shadow: 0 0 10px #00fff5;');
      console.log('%c✨ Designed by JOOLIO', 'font-size: 14px; color: #ffd700; text-shadow: 0 0 5px #ffd700;');
      console.log('%c🌐 https://joolio.me', 'font-size: 12px; color: #ff00ff;');

      // Cache DOM elements
      cacheElements();

      // Setup canvas
      canvas = elements.canvas;
      ctx = canvas.getContext('2d');

      // Load Joolix sprite
      joolixSprite = new Image();
      joolixSprite.src = './assets/images/joolix_runner_npc.webp';

      // Handle load error
      joolixSprite.onerror = function() {
        console.warn('Failed to load Joolix sprite, using fallback');
      };

      // Load high score
      highScore = parseInt(localStorage.getItem('neon_joolix_runner_highScore')) || 0;
      elements.highScore.textContent = highScore;

      // Setup event listeners
      setupEventListeners();

      // Initial canvas resize
      resizeCanvas();

      // Initialize game
      initGame();
      drawBackground();
      drawGround();
      joolix.draw();
      elements.startOverlay.classList.add('neon_joolix_runner_overlay--active');
    },

    start: startGame,
    pause: togglePause,
    restart: restartGame,

    getScore: function() {
      return Math.floor(score / 10);
    },

    getHighScore: function() {
      return highScore;
    },

    getState: function() {
      return gameState;
    }
  };

})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  NeonJoolixRunner.init();
});
