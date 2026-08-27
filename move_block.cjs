const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

// Puan Hareketleri is lines 968 to 990 (0-indexed)
const blockToMove = lines.splice(968, 23);

// Now we need to insert it before what was line 966 (which is now index 965 because we spliced 968. Wait, if we splice later indices first, it's fine).
// Actually, it's safer to just extract using regex.
