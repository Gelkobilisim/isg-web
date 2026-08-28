const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("import { fileURLToPath } from 'url';", "");

fs.writeFileSync('server.ts', code);
