// Football Career Simulator V11.0 - Luxury Properties, Vehicles & Lifestyle Engine

class LifeSimulator {
  static render(player, onBuyProperty, onBuyVehicle) {
    const currentProp = GAME_CONFIG.PROPERTIES.find(p => p.id === player.propertyId) || GAME_CONFIG.PROPERTIES[0];
    const currentCar = GAME_CONFIG.VEHICLES.find(v => p.id === player.vehicleId) || GAME_CONFIG.VEHICLES[0];

    return `
    <div class="glass-panel">
      <h2>🏠 奢华生活与个人资产模拟 (Properties & Garage)</h2>
      <p class="scout-label" style="margin-bottom: 20px;">提升个人住所品质与座驾，获得额外粉丝关注、体能恢复与豪门声望加成</p>

      <div class="top-status-bar" style="margin-bottom: 20px;">
        <div class="status-card">
          <span class="label">当前名下房产</span>
          <span class="val">${currentProp.icon} ${currentProp.name}</span>
        </div>
        <div class="status-card">
          <span class="label">当前私人座驾</span>
          <span class="val">${currentCar.icon} ${currentCar.name}</span>
        </div>
        <div class="status-card">
          <span class="label">可支配资产</span>
          <span class="val highlight-gold">€${player.money.toLocaleString()}</span>
        </div>
      </div>

      <h3 style="color: var(--gold-primary); margin-bottom: 12px;">🏢 豪宅房产列表升级</h3>
      <div class="options-container" style="margin-bottom: 25px;">
        ${GAME_CONFIG.PROPERTIES.map(prop => `
          <div class="option-btn" style="cursor: default; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="opt-text">${prop.icon} ${prop.name}</span>
              <p class="opt-effect">${prop.bonus} (声望加成 +${prop.prestige})</p>
            </div>
            ${player.propertyId === prop.id ? 
              '<span class="brand-badge" style="background:#10b981; color:#000;">当前入住</span>' : 
              `<button class="btn-primary" style="padding: 6px 14px; font-size: 0.85rem;" ${player.money < prop.cost ? 'disabled opacity="0.5"' : ''} onclick="buyProperty('${prop.id}', ${prop.cost})">购置 €${prop.cost.toLocaleString()}</button>`
            }
          </div>
        `).join('')}
      </div>

      <h3 style="color: var(--gold-primary); margin-bottom: 12px;">🏎️ 私人车库座驾</h3>
      <div class="options-container">
        ${GAME_CONFIG.VEHICLES.map(car => `
          <div class="option-btn" style="cursor: default; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="opt-text">${car.icon} ${car.name}</span>
            </div>
            ${player.vehicleId === car.id ? 
              '<span class="brand-badge" style="background:#10b981; color:#000;">已在车库</span>' : 
              `<button class="btn-primary" style="padding: 6px 14px; font-size: 0.85rem;" ${player.money < car.cost ? 'disabled opacity="0.5"' : ''} onclick="buyVehicle('${car.id}', ${car.cost})">购入 €${car.cost.toLocaleString()}</button>`
            }
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }
}
