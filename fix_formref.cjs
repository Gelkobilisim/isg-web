const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldStr = `    const [form, setForm] = useState({ 
      plaka: '', 
      sofor: '', 
      destCountry: 'Türkiye',
      destLocation: '', 
      destCompany: '', 
      projectNo: '', 
      tonnage: '', 
      not: '' 
    });`;

const newStr = `    const formRef = useRef({ 
      plaka: '', 
      sofor: '', 
      destCountry: 'Türkiye',
      destLocation: '', 
      destCompany: '', 
      projectNo: '', 
      tonnage: '', 
      not: '' 
    });`;

if (code.includes('const [form, setForm] = useState({')) {
  code = code.replace(oldStr, newStr);
  fs.writeFileSync('src/App.jsx', code);
  console.log("Fixed formRef error!");
} else {
  console.log("Target string not found!");
}
