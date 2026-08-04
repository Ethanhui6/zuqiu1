// Football Career Simulator - Roulette Component

class RouletteWheel {
  constructor(containerId, onComplete) {
    this.container = document.getElementById(containerId);
    this.onComplete = onComplete;
    this.isSpinning = false;
    this.slices = [{ label: "经验爆棚 (+50 EXP)", color: "#34c759" }, { label: "突破突破 (+100 EXP)", color: "#007aff" }];
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
          <button id="spinBtn" class="btn-primary spin-btn" style="width: 100%;">🎲 开启命运抽签</button>
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
    ctx.fillStyle = "#007aff";
    ctx.fill();
  }

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    setTimeout(() => {
      this.container.innerHTML = "";
      if (this.onComplete) this.onComplete(this.slices[0]);
    }, 1200);
  }
}
