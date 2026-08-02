// Football Career Simulator V12.0 - Roulette Canvas Component

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
          <h3>🎰 职业命运转盘</h3>
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

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(slice.label, radius - 15, 5);
      ctx.restore();
    }
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.spinBtn.disabled = true;
    this.spinBtn.innerText = "⏳ 旋转中...";

    setTimeout(() => {
      this.container.innerHTML = "";
      if (this.onComplete) this.onComplete(this.slices[0]);
    }, 2000);
  }
}
