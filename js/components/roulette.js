// Football Career Simulator V13.0 - Roulette Component

class RouletteWheel {
  constructor(containerId, onComplete) {
    this.container = document.getElementById(containerId);
    this.onComplete = onComplete;
    this.isSpinning = false;
    this.slices = [{ label: "提升 (+1属性)", color: "#10B981" }, { label: "突破 (+3属性)", color: "#F59E0B" }];
    this.renderModal();
  }

  renderModal() {
    this.container.innerHTML = `
      <div class="roulette-overlay">
        <div class="roulette-modal glass-panel">
          <h3>🎰 职业命运转盘</h3>
          <div class="canvas-wrapper">
            <canvas id="rouletteCanvas" width="300" height="300"></canvas>
          </div>
          <button id="spinBtn" class="btn-primary spin-btn">🎲 开启命运抽签</button>
        </div>
      </div>
    `;
    this.canvas = document.getElementById("rouletteCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.spinBtn = document.getElementById("spinBtn");
    this.drawWheel();
    this.spinBtn.addEventListener("click", () => this.spin());
  }

  drawWheel() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,300,300);
    ctx.beginPath();
    ctx.arc(150, 150, 130, 0, 2*Math.PI);
    ctx.fillStyle = "#fa2d48";
    ctx.fill();
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    setTimeout(() => {
      this.container.innerHTML = "";
      if (this.onComplete) this.onComplete(this.slices[0]);
    }, 1500);
  }
}
