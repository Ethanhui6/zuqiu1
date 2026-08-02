// Football Career Simulator V14.0 - Hexagonal Attribute Radar Chart (Canvas)

class RadarChart {
  static drawRadar(canvasId, stats) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2, radius = Math.min(w, h) / 2 - 25;

    const keys = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"];
    const labels = ["速度", "射门", "传球", "盘带", "防守", "身体"];
    const num = keys.length;
    const angleStep = (2 * Math.PI) / num;

    ctx.clearRect(0, 0, w, h);

    // Draw Background Grid (3 Concentric Hexagons)
    for (let level = 1; level <= 3; level++) {
      const r = (radius / 3) * level;
      ctx.beginPath();
      for (let i = 0; i < num; i++) {
        const a = i * angleStep - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw Spokes
    for (let i = 0; i < num; i++) {
      const a = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(a), cy + radius * Math.sin(a));
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.stroke();

      // Draw Labels
      const lx = cx + (radius + 15) * Math.cos(a);
      const ly = cy + (radius + 15) * Math.sin(a);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#8e8e93";
      ctx.font = "600 11px -apple-system, sans-serif";
      ctx.fillText(`${labels[i]} (${stats[keys[i]] || 50})`, lx, ly);
    }

    // Draw Player Stat Polygon
    ctx.beginPath();
    for (let i = 0; i < num; i++) {
      const val = Math.min(99, stats[keys[i]] || 50);
      const r = (radius * (val / 99));
      const a = i * angleStep - Math.PI / 2;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 122, 255, 0.25)";
    ctx.fill();
    ctx.strokeStyle = "#007aff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}
