// Football Career Simulator V11.0 - 3D/Vector Player Customizer (Gear, Aging, Bandages)

class Avatar3D {
  static createSVG(player) {
    const region = player.nationalityRegion || "ASIA";
    const age = player.age || 17;
    const isInjured = player.isInjured || false;
    const gear = player.gear || { hairstyle: "modern", headband: false, wristband: true, boots: "gold" };

    const skinTones = {
      ASIA: "#f1c27d",
      EURO: "#ffd2b2",
      SA: "#d09268",
      AFRICA: "#5c3823"
    };

    const hairColors = {
      ASIA: "#1f1f1f",
      EURO: "#b89047",
      SA: "#2d1a10",
      AFRICA: "#111111"
    };

    const skin = skinTones[region] || skinTones.ASIA;
    const hair = hairColors[region] || hairColors.ASIA;
    const jerseyColor = player.teamColor || "#D22630";
    const jerseyAccent = player.teamAccent || "#000000";

    // Age effect (Wrinkles/Beard after 30)
    const hasBeard = age >= 28;

    return `
    <svg viewBox="0 0 200 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="player-avatar-3d">
      <defs>
        <radialGradient id="card3dGlow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ffe8a3" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#090b0e" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${jerseyColor}"/>
          <stop offset="100%" stop-color="${jerseyAccent}"/>
        </linearGradient>
      </defs>

      <!-- 3D Stadium Lighting Glow Background -->
      <circle cx="100" cy="90" r="90" fill="url(#card3dGlow)"/>

      <!-- Body / Jersey Collar -->
      <path d="M 32,210 Q 100,160 168,210 L 180,220 L 20,220 Z" fill="url(#jerseyGrad)"/>
      <path d="M 75,172 Q 100,192 125,172 Q 100,182 75,172 Z" fill="#ffffff" opacity="0.95"/>

      <!-- Wristband / Gear -->
      ${gear.wristband ? '<rect x="25" y="200" width="15" height="12" rx="3" fill="#38bdf8"/>' : ''}

      <!-- Neck -->
      <rect x="84" y="128" width="32" height="48" rx="8" fill="${skin}" filter="brightness(0.92)"/>

      <!-- Head Structure -->
      <ellipse cx="100" cy="98" rx="42" ry="50" fill="${skin}"/>
      <circle cx="56" cy="100" r="9" fill="${skin}"/>
      <circle cx="144" cy="100" r="9" fill="${skin}"/>

      <!-- Eyes & Brow Expression -->
      <ellipse cx="83" cy="93" rx="5.5" ry="3.8" fill="#1e293b"/>
      <ellipse cx="117" cy="93" rx="5.5" ry="3.8" fill="#1e293b"/>
      <circle cx="84.5" cy="92" r="1.5" fill="#ffffff"/>
      <circle cx="118.5" cy="92" r="1.5" fill="#ffffff"/>

      <path d="M 72,85 Q 83,80 91,85" stroke="#1c1c1c" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M 109,85 Q 117,80 128,85" stroke="#1c1c1c" stroke-width="3.2" fill="none" stroke-linecap="round"/>

      <!-- Nose & Lips -->
      <path d="M 100,93 Q 103,108 97,110 L 103,110" stroke="#bf8158" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 86,124 Q 100,134 114,124" stroke="#a35438" stroke-width="3" fill="none" stroke-linecap="round"/>

      <!-- Veteran Beard (Age >= 28) -->
      ${hasBeard ? `<path d="M 78,118 Q 100,148 122,118 Q 100,140 78,118 Z" fill="${hair}" opacity="0.6"/>` : ''}

      <!-- Hairstyle & Headband Gear -->
      <path d="M 56,90 Q 54,45 100,42 Q 146,45 144,90 Q 130,52 100,50 Q 70,52 56,90 Z" fill="${hair}"/>
      ${gear.headband ? '<rect x="58" y="65" width="84" height="8" rx="3" fill="#e5c158"/>' : ''}

      <!-- Medical Bandage / Injury Overlay -->
      ${isInjured ? `
        <rect x="68" y="70" width="45" height="10" rx="3" fill="#ffffff" transform="rotate(-12 90 75)" opacity="0.9"/>
        <path d="M 70,72 L 110,80" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3"/>
      ` : ''}
    </svg>
    `;
  }
}
