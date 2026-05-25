const fs = require('fs');

const content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for 'image_url' or 'Image' in src/app/admin/page.tsx...");
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('image_url') || line.toLowerCase().includes('image configuration')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
