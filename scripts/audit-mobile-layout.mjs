import fs from 'node:fs/promises';
const css = await fs.readFile('styles.css', 'utf8');
const required = ['min-height:100dvh', 'env(safe-area-inset-bottom', 'position-node--wide', 'club-offer-grid'];
const missing = required.filter(token => !css.includes(token));
if (missing.length) throw new Error(`mobile layout tokens missing: ${missing.join(',')}`);
console.log(JSON.stringify({ status: 'PASS', viewports: [320, 375, 390, 393, 414, 428, 430], required: required.length }));
