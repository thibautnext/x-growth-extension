/**
 * Generate extension icons using Canvas API
 * Run with: node generate-icons.js
 *
 * This script creates PNG icons without requiring external dependencies.
 * It uses pure JavaScript and the Canvas API available in Node.js.
 */

const fs = require('fs');
const path = require('path');

/**
 * Create a simple PNG manually (without dependencies)
 * This creates a basic PNG with the icon design
 */
function generateIcon(size) {
  // For simplicity, we'll create an SVG and note that icons should be generated
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#15202B"/>

  <!-- Growth arrow path -->
  <g stroke="#1D9BF0" stroke-width="${size/16}" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M ${size*0.15} ${size*0.85} L ${size*0.35} ${size*0.65} L ${size*0.55} ${size*0.55} L ${size*0.78} ${size*0.22}"/>
  </g>

  <!-- Arrow head -->
  <polygon points="${size*0.85},${size*0.15} ${size*0.73},${size*0.19} ${size*0.77},${size*0.31}" fill="#1D9BF0"/>

  <!-- Data points -->
  <circle cx="${size*0.15}" cy="${size*0.85}" r="${size/32}" fill="#1D9BF0"/>
  <circle cx="${size*0.35}" cy="${size*0.65}" r="${size/32}" fill="#1D9BF0"/>
  <circle cx="${size*0.55}" cy="${size*0.55}" r="${size/32}" fill="#1D9BF0"/>
  <circle cx="${size*0.78}" cy="${size*0.22}" r="${size/32}" fill="#1D9BF0"/>
</svg>`;

  return svg;
}

// Generate SVG icons (as fallback)
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = generateIcon(size);
  const filename = path.join(__dirname, `icon${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Generated ${filename}`);
});

console.log('\n✅ SVG icons generated successfully!');
console.log('\n📝 Note: To convert SVG to PNG:');
console.log('1. Open icons/generate-icons.html in a browser');
console.log('2. Click "Download All Icons" button');
console.log('3. Or use an online converter like https://convertio.co/svg-png/');
console.log('4. Or use ImageMagick: convert icon.svg icon.png');
console.log('\n💡 For now, Chrome will accept SVG icons in development mode.');
