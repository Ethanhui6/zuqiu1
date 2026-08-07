const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

export function freeKickTrajectory({ curve = 60, angle = 50, power = 64 } = {}) {
  curve = clamp(curve, 0, 100);
  angle = clamp(angle, 0, 100);
  power = clamp(power, 0, 100);
  const targetX = clamp(50 + (angle - 50) * .32 + (curve - 50) * .08, 16, 84);
  const targetY = clamp(31 - (power - 50) * .14, 16, 44);
  const controlX = clamp(50 + (curve - 50) * .48, 10, 90);
  const controlY = clamp(106 - power * .44 - Math.abs(curve - 50) * .1, 48, 92);
  return { curve, angle, power, targetX, targetY, controlX, controlY, path: `M 50 146 Q ${controlX} ${controlY} ${targetX} ${targetY}` };
}
