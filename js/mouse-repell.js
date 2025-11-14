// Get canvas and context
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Set canvas to full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Resize canvas when window is resized
window.addEventListener("resize", function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  init(); // Reinitialize when resized
});

// Mouse position tracking
const mouse = {
  x: undefined,
  y: undefined,
};

// Update mouse position
window.addEventListener("mousemove", function (event) {
  mouse.x = event.x;
  mouse.y = event.y;
});

// Circle class
class Circle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 25; // 50px diameter
    this.velocity = {
      x: (Math.random() - 0.5) * 4, // Increased from 1.5 to 4
      y: (Math.random() - 0.5) * 4, // Increased from 1.5 to 4
    };
    this.mass = this.radius * 2; // Mass proportional to size
    this.friction = 0.995; // Reduced friction for more movement
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.closePath();
  }

  update(circles) {
    // Apply cursor repulsion with increased force
    if (mouse.x !== undefined && mouse.y !== undefined) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const repulsionRadius = 200; // Increased from 100 to 200

      if (distance < repulsionRadius) {
        // Calculate repulsion force (stronger when closer)
        const force = (repulsionRadius - distance) / repulsionRadius;
        const angle = Math.atan2(dy, dx);

        // Apply force with increased multiplier
        this.velocity.x += Math.cos(angle) * force * 2.0; // Increased from 0.5 to 2.0
        this.velocity.y += Math.sin(angle) * force * 2.0; // Increased from 0.5 to 2.0
      }
    }

    // Check collisions with other circles
    for (let i = 0; i < circles.length; i++) {
      if (this === circles[i]) continue;

      const circle = circles[i];
      const dx = this.x - circle.x;
      const dy = this.y - circle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.radius + circle.radius) {
        resolveCollision(this, circle);
      }
    }

    // Apply friction
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;

    // Update position
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Bounce off walls with more energy
    if (this.x - this.radius <= 0 || this.x + this.radius >= canvas.width) {
      this.velocity.x = -this.velocity.x * 1.05; // Add 5% more energy on bounce

      // Keep within bounds
      if (this.x - this.radius <= 0) {
        this.x = this.radius;
      } else {
        this.x = canvas.width - this.radius;
      }
    }

    if (this.y - this.radius <= 0 || this.y + this.radius >= canvas.height) {
      this.velocity.y = -this.velocity.y * 1.05; // Add 5% more energy on bounce

      // Keep within bounds
      if (this.y - this.radius <= 0) {
        this.y = this.radius;
      } else {
        this.y = canvas.height - this.radius;
      }
    }

    this.draw();
  }
}

// Collision resolution function
function resolveCollision(circle1, circle2) {
  const xVelocityDiff = circle1.velocity.x - circle2.velocity.x;
  const yVelocityDiff = circle1.velocity.y - circle2.velocity.y;

  const xDist = circle2.x - circle1.x;
  const yDist = circle2.y - circle1.y;

  // Prevent accidental overlap
  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
    // Angle between the two colliding circles
    const angle = -Math.atan2(yDist, xDist);

    // Masses
    const m1 = circle1.mass;
    const m2 = circle2.mass;

    // Velocity before equation
    const u1 = rotate(circle1.velocity, angle);
    const u2 = rotate(circle2.velocity, angle);

    // Velocity after 1d collision equation
    const v1 = {
      x: (u1.x * (m1 - m2)) / (m1 + m2) + (u2.x * 2 * m2) / (m1 + m2),
      y: u1.y,
    };
    const v2 = {
      x: (u2.x * (m2 - m1)) / (m1 + m2) + (u1.x * 2 * m1) / (m1 + m2),
      y: u2.y,
    };

    // Final velocity after rotating axis back to original position
    const vFinal1 = rotate(v1, -angle);
    const vFinal2 = rotate(v2, -angle);

    // Swap velocities for realistic bounce effect
    circle1.velocity.x = vFinal1.x;
    circle1.velocity.y = vFinal1.y;

    circle2.velocity.x = vFinal2.x;
    circle2.velocity.y = vFinal2.y;

    // Prevent sticking by moving circles apart slightly
    const distance = Math.sqrt(xDist * xDist + yDist * yDist);
    const overlap = circle1.radius + circle2.radius - distance;

    if (overlap > 0) {
      // Move circles apart proportionally to their masses
      const moveX = (xDist / distance) * overlap * 0.5;
      const moveY = (yDist / distance) * overlap * 0.5;

      circle1.x -= moveX;
      circle1.y -= moveY;
      circle2.x += moveX;
      circle2.y += moveY;
    }
  }
}

// Helper function to rotate velocities
function rotate(velocity, angle) {
  return {
    x: velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
    y: velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle),
  };
}

// Create circles
const circles = [];
const numCircles = 50;

function init() {
  circles.length = 0; // Clear existing circles

  for (let i = 0; i < numCircles; i++) {
    const radius = 25;
    let x = Math.random() * (canvas.width - radius * 2) + radius;
    let y = Math.random() * (canvas.height - radius * 2) + radius;

    // Check for collisions when placing new circles
    if (i !== 0) {
      for (let j = 0; j < circles.length; j++) {
        const existingCircle = circles[j];
        const dx = x - existingCircle.x;
        const dy = y - existingCircle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If circles overlap, try a new position
        if (distance < radius + existingCircle.radius) {
          x = Math.random() * (canvas.width - radius * 2) + radius;
          y = Math.random() * (canvas.height - radius * 2) + radius;
          j = -1; // Restart the check
        }
      }
    }

    circles.push(new Circle(x, y));
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  circles.forEach((circle) => {
    circle.update(circles);
  });
}

init();
animate();
