const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);`,
  `// CommonJS environment globals are available when compiled by esbuild`
);

fs.writeFileSync('server.ts', code);
