const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');

const issues = [];
// check flex directions that might not wrap
const lines = code.split('\n');
lines.forEach((line, i) => {
    if (line.includes('flex ') && !line.includes('flex-col') && !line.includes('flex-wrap') && !line.includes('hidden')) {
        // Just checking if there are very wide items inside flex without wrap
    }
});

// find w-xx that might break mobile
const matches = [...code.matchAll(/className="[^"]*w-[0-9]{2,}[^"]*"/g)];
for (const match of matches) {
    if (!match[0].includes('md:w-') && !match[0].includes('w-full') && !match[0].includes('max-w')) {
        // e.g. w-64 without max-w-full or md:w-64
        console.log("Possible rigid width at:", match[0].substring(0, 50));
    }
}
