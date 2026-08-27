const fs = require('fs');
const code = fs.readFileSync('src/App.jsx', 'utf8');

const lines = code.split('\n');
const search1 = "const [editUserForm";
const search2 = "useEffect(() => {";
const search3 = "const handleUpdateUser =";
const search4 = "const handleDeleteUser =";
const search5 = "<button onClick={() => handleUpdateUser(";
const search6 = "<button onClick={() => handleDeleteUser(";
const search7 = "{showDeleteModal && (";

console.log("Search 1:", lines.findIndex(l => l.includes(search1)));
console.log("Search 3:", lines.findIndex(l => l.includes(search3)));
console.log("Search 4:", lines.findIndex(l => l.includes(search4)));
console.log("Search 5:", lines.findIndex(l => l.includes(search5)));
console.log("Search 6:", lines.findIndex(l => l.includes(search6)));
console.log("Search 7:", lines.findIndex(l => l.includes(search7)));
