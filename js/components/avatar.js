// Football Career Simulator V10.0 - Diverse Vector SVG Avatar Generator

class AvatarGenerator {
  static createSVG(player) {
    const region = player.nationalityRegion || "ASIA";
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

    return `
    <svg viewBox="0 0 200 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="player-avatar-svg">
      <defs>
        <radialGradient id="avatarGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ffe8a3" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0d0f12" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="jerseyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${jerseyColor}"/>
          <stop offset="100%" stop-color="${jerseyAccent}"/>
        </linearGradient>
      </defs>

      <!-- Background Glow -->
      <circle cx="100" cy="90" r="85" fill="url(#avatarGlow)"/>

      <!-- Shoulders & Jersey -->
      <path d="M 35,210 Q 100,165 165,210 L 175,220 L 25,220 Z" fill="url(#jerseyGrad)"/>
      <!-- Collar -->
      <path d="M 75,175 Q 100,195 125,175 Q 100,185 75,175 Z" fill="#ffffff" opacity="0.9"/>

      <!-- Neck -->
      <rect x="84" y="130" width="32" height="48" rx="8" fill="${skin}" filter="brightness(0.92)"/>

      <!-- Head & Face -->
      <ellipse cx="100" cy="100" rx="42" ry="50" fill="${skin}"/>

      <!-- Ears -->
      <circle cx="56" cy="102" r="9" fill="${skin}"/>
      <circle cx="144" cy="102" r="9" fill="${skin}"/>

      <!-- Eyes & Eyebrows -->
      <ellipse cx="83" cy="95" rx="5" ry="3.5" fill="#2d2d2d"/>
      <ellipse cx="117" cy="95" rx="5" ry="3.5" fill="#2d2d2d"/>
      <circle cx="84.5" cy="94" r="1.5" fill="#ffffff"/>
      <circle cx="118.5" cy="94" r="1.5" fill="#ffffff"/>
      <!-- Eyebrows -->
      <path d="M 73,87 Q 83,83 91,87" stroke="#1c1c1c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 109,87 Q 117,83 127,87" stroke="#1c1c1c" stroke-width="3" fill="none" stroke-linecap="round"/>

      <!-- Nose -->
      <path d="M 100,95 Q 103,110 97,112 L 103,112" stroke="#bf8158" stroke-width="2.5" fill="none" stroke-linecap="round"/>

      <!-- Confident Smile -->
      <path d="M 86,126 Q 100,136 114,126" stroke="#a35438" stroke-width="3" fill="none" stroke-linecap="round"/>

      <!-- Dynamic Hairstyle -->
      <path d="M 56,92 Q 54,48 100,45 Q 146,48 144,92 Q 130,55 100,53 Q 70,55 56,92 Z" fill="${hair}"/>
      <path d="M 62,60 Q 100,38 138,60 Q 100,48 62,60 Z" fill="${hair}" opacity="0.8"/>
    </svg>
    `;
  }
}
