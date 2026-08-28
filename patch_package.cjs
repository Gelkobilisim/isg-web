const fs = require('fs');
let code = fs.readFileSync('package.json', 'utf8');

code = code.replace('"dev": "vite",', '"dev": "tsx server.ts",');
code = code.replace('"build": "vite build",', '"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",');
code = code.replace('"preview": "vite preview"', '"start": "node dist/server.cjs"');

fs.writeFileSync('package.json', code);
