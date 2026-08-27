const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldHandle = `const handleImageUpload = (file, callback) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_WIDTH) { 
        height = Math.round(height * (MAX_WIDTH / width)); 
        width = MAX_WIDTH; 
      }
      canvas.width = width; 
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.6)); 
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};`;

const newHandle = `const handleImageUpload = (file, callback) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1200;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round(height * (MAX_DIM / width));
          width = MAX_DIM;
        } else {
          width = Math.round(width * (MAX_DIM / height));
          height = MAX_DIM;
        }
      }
      
      canvas.width = width; 
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.6)); 
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};`;

code = code.replace(oldHandle, newHandle);

fs.writeFileSync('src/App.jsx', code);
