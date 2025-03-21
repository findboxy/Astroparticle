// script.js
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const groundHeight = canvas.height * 0.2; // Ground covers 20% of the canvas
let detectorRadius = 25; // Initial detector size
const detectorX = canvas.width / 2;
const detectorY = canvas.height - groundHeight / 2;

let particles = [];
let particlesDetected = 0; // Counter for particles touching the detector
let leadBricks = []; // Array to store lead bricks
let selectedBrick = null; // Track the currently selected brick for dragging
let goalCompleted = false; // Track if the goal has been completed
let detectorUpgrades = 0; // Track how many times the detector has been upgraded

// Particle class
class Particle {
  constructor(x, y, speed, angle, decayCount) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.angle = angle;
    this.decayCount = decayCount;
    this.decayed = false;
    this.inGround = false; // Track if the particle is in the ground
    this.groundTimer = 0; // Timer for ground penetration
    this.markForRemoval = false; // Track if the particle should be removed
  }

  update() {
    this.x += Math.tan((this.angle * Math.PI) / 180) * this.speed;
    this.y += this.speed;

    // Check for decay
    if (this.y > 100 && !this.decayed && this.decayCount > 0 && Math.random() < 0.1) {
      this.decayed = true;
      this.decayCount--;
      createSecondaryParticles(this);
    }

    // Check if particle hits the ground
    if (this.y > canvas.height - groundHeight && !this.inGround) {
      this.inGround = true;
      // 50% chance to remove the particle on ground contact
      if (Math.random() < 0.5) {
        this.markForRemoval = true;
      }
    }

    // If particle is in the ground, increment the ground timer
    if (this.inGround) {
      this.groundTimer += 16; // Increment timer by ~16ms (assuming 60 FPS)
      // 50% chance to remove the particle every 0.05 seconds (50ms)
      if (this.groundTimer >= 50 && Math.random() < 0.5) {
        this.markForRemoval = true;
        this.groundTimer = 0; // Reset the timer
      }
    }

    // Check if particle touches the detector
    const dx = this.x - detectorX;
    const dy = this.y - detectorY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < detectorRadius) {
      particlesDetected++;
      this.markForRemoval = true;

      // Check if the goal has been completed
      if (!goalCompleted && particlesDetected >= 50) {
        goalCompleted = true;
        showGoalModal();
      }
    }

    // Check if particle hits a lead brick
    for (const brick of leadBricks) {
      if (
        this.x >= brick.x &&
        this.x <= brick.x + brick.width &&
        this.y >= brick.y &&
        this.y <= brick.y + brick.height
      ) {
        if (Math.random() < 0.9) { // 90% chance to remove the particle
          this.markForRemoval = true;
        }
      }
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

// Lead brick class
class LeadBrick {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw() {
    ctx.fillStyle = '#333333'; // Dark gray for lead bricks
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Function to create secondary particles
function createSecondaryParticles(parentParticle) {
  const angle1 = 2 + Math.random() * 3; // Random angle between 2° and 5°
  const angle2 = -angle1; // Opposite angle

  particles.push(new Particle(parentParticle.x, parentParticle.y, parentParticle.speed * (0.9 + Math.random() * 0.2), angle1, parentParticle.decayCount));
  particles.push(new Particle(parentParticle.x, parentParticle.y, parentParticle.speed * (0.9 + Math.random() * 0.2), angle2, parentParticle.decayCount));
}

// Function to spawn cosmic rays
function spawnParticle() {
  const x = Math.random() * canvas.width;
  const speed = 2 + Math.random() * 3;
  const decayCount = Math.floor(Math.random() * 4) + 2; // Random decay count between 2 and 5
  particles.push(new Particle(x, 0, speed, 0, decayCount));
}

// Function to draw the particle counter
function drawParticleCounter() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`Particles detected: ${particlesDetected}`, 10, 30);
}

// Function to draw the plus button for detector upgrades
function drawPlusButton() {
  const buttonX = detectorX + detectorRadius + 10;
  const buttonY = detectorY - 15;
  const buttonSize = 30;

  // Draw button background
  ctx.fillStyle = '#4CAF50'; // Green color
  ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);

  // Draw plus sign
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('+', buttonX + 10, buttonY + 22);
}

// Function to handle detector upgrades
function upgradeDetector() {
  if (detectorUpgrades < 3) {
    detectorRadius += 10; // Increase detector size by 10 pixels
    detectorUpgrades++;
    console.log(`Detector upgraded! New radius: ${detectorRadius}`);
  } else {
    console.log('Maximum upgrades reached!');
  }
}

// Function to show the goal completion modal
function showGoalModal() {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.backgroundColor = 'white';
  modal.style.padding = '20px';
  modal.style.borderRadius = '10px';
  modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  modal.style.zIndex = '1000';
  modal.style.textAlign = 'center';

  modal.innerHTML = `
    <h2>Congratulations!</h2>
    <p>You’ve completed your first goal of detecting 50 particles.</p>
    <p>You have received additional resources and can build a bigger detector!</p>
    <button id="close-modal" style="padding: 10px 20px; margin-top: 10px;">Close</button>
  `;

  document.body.appendChild(modal);

  // Add event listener to the close button
  const closeButton = document.getElementById('close-modal');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

// Function to initialize lead bricks
function initializeLeadBricks() {
  const brickWidth = 50;
  const brickHeight = 20;
  const brickStackX = 50; // X position of the brick stack
  const brickStackY = canvas.height - groundHeight - 100; // Y position of the brick stack

  for (let i = 0; i < 5; i++) {
    leadBricks.push(new LeadBrick(brickStackX, brickStackY - i * brickHeight, brickWidth, brickHeight));
  }
}

// Function to handle mouse events for dragging bricks and clicking the plus button
function handleMouseEvents() {
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if the mouse is over a brick
    for (const brick of leadBricks) {
      if (
        mouseX >= brick.x &&
        mouseX <= brick.x + brick.width &&
        mouseY >= brick.y &&
        mouseY <= brick.y + brick.height
      ) {
        selectedBrick = brick;
        break;
      }
    }

    // Check if the mouse is over the plus button
    const buttonX = detectorX + detectorRadius + 10;
    const buttonY = detectorY - 15;
    const buttonSize = 30;

    if (
      mouseX >= buttonX &&
      mouseX <= buttonX + buttonSize &&
      mouseY >= buttonY &&
      mouseY <= buttonY + buttonSize
    ) {
      upgradeDetector();
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (selectedBrick) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Move the selected brick
      selectedBrick.x = mouseX - selectedBrick.width / 2;
      selectedBrick.y = mouseY - selectedBrick.height / 2;
    }
  });

  canvas.addEventListener('mouseup', () => {
    selectedBrick = null; // Release the selected brick
  });
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw ground
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Draw detector
  ctx.beginPath();
  ctx.arc(detectorX, detectorY, detectorRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'red';
  ctx.fill();

  // Draw lead bricks
  for (const brick of leadBricks) {
    brick.draw();
  }

  // Draw plus button
  drawPlusButton();

  // Update and draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.update();
    particle.draw();

    // Remove particles marked for removal or off-screen
    if (particle.markForRemoval || particle.y > canvas.height + 10) {
      particles.splice(i, 1);
    }
  }

  // Draw particle counter
  drawParticleCounter();

  requestAnimationFrame(gameLoop);
}

// Initialize lead bricks
initializeLeadBricks();

// Set up mouse event listeners for dragging bricks and clicking the plus button
handleMouseEvents();

// Spawn cosmic rays at regular intervals
setInterval(spawnParticle, 500);

// Start the game loop
gameLoop();