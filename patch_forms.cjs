const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace SefDashboard formRef
code = code.replace(
    /const formRef = React\.useRef\(\{ dept: "Boyahane", priority: 'yuksek', desc: '' \}\);/,
    "const [formState, setFormState] = React.useState({ dept: 'Boyahane', priority: 'yuksek', desc: '' });"
);

code = code.replace(
    /const current = formRef\.current;\s*createTask\(current\.dept, current\.priority, current\.desc, 24, imgPreview\);\s*formRef\.current = \{ dept: "Boyahane", priority: 'yuksek', desc: '' \};\s*e\.target\.reset\(\);/g,
    "createTask(formState.dept, formState.priority, formState.desc, 24, imgPreview);\n        setFormState({ dept: 'Boyahane', priority: 'yuksek', desc: '' });"
);

// We need to replace all formRef.current with formState in the JSX of SefDashboard
code = code.replace(/defaultValue=\{formRef\.current\.dept\} onChange=\{e=>formRef\.current\.dept = e\.target\.value\}/g, "value={formState.dept} onChange={e=>setFormState({...formState, dept: e.target.value})}");
code = code.replace(/defaultValue=\{formRef\.current\.priority\} onChange=\{e=>formRef\.current\.priority = e\.target\.value\}/g, "value={formState.priority} onChange={e=>setFormState({...formState, priority: e.target.value})}");
code = code.replace(/defaultValue=\{formRef\.current\.desc\} onChange=\{e=>formRef\.current\.desc = e\.target\.value\}/g, "value={formState.desc} onChange={e=>setFormState({...formState, desc: e.target.value})}");


// Replace YuklemeciDashboard formRef
code = code.replace(
    /const formRef = useRef\(\{\s*plaka: '',\s*sofor: '',\s*destCountry: 'Türkiye',\s*destLocation: '',\s*destCompany: '',\s*projectNo: '',\s*tonnage: '',\s*not: ''\s*\}\);/,
    "const [formState, setFormState] = useState({ plaka: '', sofor: '', destCountry: 'Türkiye', destLocation: '', destCompany: '', projectNo: '', tonnage: '', not: '' });"
);

code = code.replace(
    /const current = formRef\.current;\s*createLoading\(current\.plaka, current\.sofor, current\.destCountry, current\.destLocation, current\.destCompany, current\.projectNo, current\.tonnage, current\.not, imgPreview\);\s*formRef\.current = \{ plaka: '', sofor: '', destCountry: 'Türkiye', destLocation: '', destCompany: '', projectNo: '', tonnage: '', not: '' \};\s*e\.target\.reset\(\);/g,
    "createLoading(formState.plaka, formState.sofor, formState.destCountry, formState.destLocation, formState.destCompany, formState.projectNo, formState.tonnage, formState.not, imgPreview);\n      setFormState({ plaka: '', sofor: '', destCountry: 'Türkiye', destLocation: '', destCompany: '', projectNo: '', tonnage: '', not: '' });"
);

// Reset button inside YuklemeciDashboard
code = code.replace(
    /formRef\.current = \{plaka:'', sofor:'', destCountry:'Türkiye', destLocation:'', destCompany:'', projectNo:'', tonnage:'', not:''\};/g,
    "setFormState({plaka:'', sofor:'', destCountry:'Türkiye', destLocation:'', destCompany:'', projectNo:'', tonnage:'', not:''});"
);


// Replacing inputs in YuklemeciDashboard
const replacer = (field, uppercase = false) => {
    let regex = new RegExp(`defaultValue=\\{formRef\\.current\\.${field}\\} onChange=\\{e=>formRef\\.current\\.${field} = e\\.target\\.value${uppercase ? '\\.toUpperCase\\(\\)' : ''}\\}`);
    code = code.replace(regex, `value={formState.${field}} onChange={e=>setFormState({...formState, ${field}: e.target.value${uppercase ? '.toUpperCase()' : ''}})}`);
};

replacer('plaka', true);
replacer('sofor');
replacer('destCountry');
replacer('destLocation');
replacer('destCompany');
replacer('projectNo');
replacer('tonnage');
replacer('not');


fs.writeFileSync('src/App.jsx', code);
