// Football Career Simulator V13.0 - Life Simulator Component

class LifeSimulator {
  static render(player) {
    const currentProp = GAME_CONFIG.PROPERTIES.find(p => p.id === player.propertyId) || GAME_CONFIG.PROPERTIES[0];
    const currentCar = GAME_CONFIG.VEHICLES.find(v => v.id === player.vehicleId) || GAME_CONFIG.VEHICLES[0];

    return `
    <div class="glass-panel">
      <h2>🏠 奢华生活与车库 (Lifestyle & Garage)</h2>
      <div class="top-status-bar" style="margin-bottom: 20px;">
        <div class="status-card"><span class="label">名下房产</span><span class="val">${currentProp.icon} ${currentProp.name}</span></div>
        <div class="status-card"><span class="label">私人座驾</span><span class="val">${currentCar.icon} ${currentCar.name}</span></div>
      </div>

      <div class="options-container">
        ${GAME_CONFIG.PROPERTIES.map(prop => `
          <div class="option-btn" style="cursor: default; display: flex; justify-content: space-between; align-items: center;">
            <div><span class="opt-text">${prop.icon} ${prop.name}</span><p class="opt-effect">${prop.bonus}</p></div>
            ${player.propertyId === prop.id ? '<span class="brand-badge" style="background:#10b981; color:#000;">已入住</span>' : `<button class="btn-primary" style="padding: 6px 14px; font-size: 0.85rem;" onclick="buyProperty('${prop.id}', ${prop.cost})">购置 €${prop.cost.toLocaleString()}</button>`}
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }
}
