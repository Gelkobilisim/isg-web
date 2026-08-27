const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const logoCode = `const CompanyLogo = ({ className = "", scale = "scale-100", theme = 'blue' }) => (
    <div className={\`flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm \${className}\`}>
      <div className={\`flex items-center space-x-1 \${scale} origin-center\`}>
        <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden">
           <div className={\`absolute top-0 left-0 w-full h-full border-t-4 border-l-4 rounded-tl-full opacity-80 \${theme==='orange'?'border-orange-600':'border-blue-900'}\`}></div>
           <div className={\`absolute top-1 left-1 w-[90%] h-[90%] border-t-4 border-l-4 rounded-tl-full \${theme==='orange'?'border-orange-400':'border-blue-400'}\`}></div>
           <div className="absolute top-3 left-2 w-[80%] h-[80%] border-t-4 border-l-4 border-gray-400 rounded-tl-full opacity-50"></div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-1">
            <span className="text-gray-800 dark:text-gray-100 font-extrabold text-2xl tracking-tighter">ADS</span>
            <span className="text-gray-800 dark:text-gray-100 font-bold text-xl">Metal A.Ş.</span>
          </div>
          <span className={\`text-[6px] font-bold text-white px-1 rounded-sm tracking-widest uppercase -mt-1 w-max \${theme==='orange'?'bg-orange-600':'bg-blue-900'}\`}>Transformer Tanks & Fin Walls</span>
        </div>
      </div>
    </div>
  );`;

// Remove from inside App
code = code.replace(logoCode, "");

// Remove any remaining extraction of CompanyLogo in the contextValue inside App (if any)
code = code.replace(/,\s*CompanyLogo\s*\}\)/g, "})");
code = code.replace(/CompanyLogo,/g, "");

// Add CompanyLogo at the top level
code = code.replace("const TimerWrapper", logoCode + "\n\nconst TimerWrapper");

fs.writeFileSync('src/App.jsx', code);
