// Football Career Simulator V10.0 - Canvas Interactive Probability Roulette Wheel

class RouletteWheel {
  constructor(containerId, onComplete) {
    this.container = document.getElementById(containerId);
    this.onComplete = onComplete;
    this.isSpinning = false;
    
    this.slices = [
      { label: "普通提升 (+1属性)", color: "#10B981", type: "NORMAL", prob: 0.55 },
      { label: "基因突破 (+3属性)", color: "#F59E0B", type: "SUPER", prob: 0.25 },
      { label: "高能蜕变 (+5属性)", color: "#8B5CF6", type: "EPIC", prob: 0.10 },
      { label: "肌肉拉伤 (-1属性)", color: "#EF4444", type: "BAD", prob: 0.10 }
    ];

    this.renderModal();
  }

  renderModal() {
    this.container.innerHTML = `
      <div class="roulette-overlay">
        <div class="roulette-modal glass-panel">
          <h3>🎰 职业命运概率转盘</h3>
          <p class="roulette-sub">转盘指针将决定本次挑战/特训的命运走势！</p>

          <div class="canvas-wrapper">
            <div class="roulette-pointer">▼</div>
            <canvas id="rouletteCanvas" width="300" height="300"></canvas>
          </div>

          <button id="spinBtn" class="btn-primary spin-btn">🎲 开启命运抽签</button>
        </div>
      </div>
    `;

    this.canvas = document.getElementById("rouletteCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.spinBtn = document.getElementById("spinBtn");

    this.drawWheel(0);
    this.spinBtn.addEventListener("click", () => this.spin());
  }

  drawWheel(angle) {
    const ctx = this.ctx;
    const numSlices = this.slices.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const cx = 150, cy = 150, radius = 135;

    ctx.clearRect(0, 0, 300, 300);

    for (let i = 0; i < numSlices; i++) {
      const slice = this.slices[i];
      const startA = angle + i * sliceAngle;
      const endA = startA + sliceAngle;

      // Draw Sector
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1e293b";
      ctx.stroke();

      // Draw Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(slice.label, radius - 15, 5);
      ctx.restore();
    }

    // Draw Center Cap
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinBtn.disabled = true;
    this.spinBtn.innerText = "⏳ 命运转盘旋转中...";

    // Weighted Random Selection
    const rand = Math.random();
    let cumulative = 0;
    let selectedIdx = 0;

    for (let i = 0; i < this.slices.length; i++) {
      cumulative += this.slices[i].prob;
      if (rand <= cumulative) {
        selectedIdx = i;
        break;
      }
    }

    const sliceAngle = (2 * Math.PI) / this.slices.length;
    // Align target index with top pointer (pointer is at 270 degrees or -Math.PI/2)
    const targetAngle = 6 * Math.PI * 2 + (2 * Math.PI - (selectedIdx + 0.5) * sliceAngle) - Math.PI / 2;

    let startTime = null;
    const duration = 3000;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = targetAngle * easeOut;

      this.drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          this.container.innerHTML = ""; // Close Modal
          if (this.onComplete) this.onComplete(this.slices[selectedIdx]);
        }, 800);
      }
    };

    requestAnimationFrame(animate);
  }
}
