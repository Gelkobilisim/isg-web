const fs = require('fs');

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace standard functions with useCallback versions
code = code.replace(
  /const getLastFridayOfCurrentMonth = \(\) => {([\s\S]*?)  };/g,
  "const getLastFridayOfCurrentMonth = useCallback(() => {$1  }, [lang]);"
);

code = code.replace(
  /const logout = \(\) => {([\s\S]*?)  };/g,
  "const logout = useCallback(() => {$1  }, []);"
);

code = code.replace(
  /const createTask = async \((.*?)\) => {([\s\S]*?)  };/g,
  "const createTask = useCallback(async ($1) => {$2  }, []);"
);

code = code.replace(
  /const updateTaskStatus = async \((.*?)\) => {([\s\S]*?)  };/g,
  "const updateTaskStatus = useCallback(async ($1) => {$2  }, []);"
);

code = code.replace(
  /const createLoading = async \((.*?)\) => {([\s\S]*?)  };/g,
  "const createLoading = useCallback(async ($1) => {$2  }, [currentUser]);"
);

code = code.replace(
  /const startLoadingProcess = async \((.*?)\) => {([\s\S]*?)  };/g,
  "const startLoadingProcess = useCallback(async ($1) => {$2  }, []);"
);

code = code.replace(
  /const finishLoading = async \((.*?)\) => {([\s\S]*?)  };/g,
  "const finishLoading = useCallback(async ($1) => {$2  }, []);"
);

code = code.replace(
  /const get24HourTonnage = \(\) => {([\s\S]*?)  };/g,
  "const get24HourTonnage = useCallback(() => {$1  }, [loadings]);"
);

code = code.replace(
  /const t = \(key\) => DICT\[lang\]\[key\] \|\| key;/g,
  "const t = useCallback((key) => DICT[lang][key] || key, [lang]);"
);

code = code.replace(
  /const toggleLang = \(\) => {([\s\S]*?)  };/g,
  "const toggleLang = useCallback(() => {$1  }, [lang]);"
);

// Wrap contextValue in useMemo
const contextValueRegex = /const contextValue = {([\s\S]*?)  };/g;
code = code.replace(contextValueRegex, `const contextValue = useMemo(() => ({$1  }), [
    currentUser, isFirebaseLoading, lang, users, points, tasks, loadings, 
    adminSystemMode, adminViewMode, selectedAdminDept, selectedAdminDate, selectedYuklemeDate,
    previewModalImg, previewModalTitle, t, toggleLang, getLastFridayOfCurrentMonth, 
    logout, createTask, updateTaskStatus, createLoading, startLoadingProcess, finishLoading, 
    get24HourTonnage, CompanyLogo
  ]);`);

// ensure useCallback and useMemo are imported
if (!code.includes('useCallback')) {
  code = code.replace(/import React, { useState, useEffect/g, 'import React, { useState, useEffect, useCallback, useMemo');
} else if (!code.includes('useMemo')) {
  code = code.replace(/useCallback/g, 'useCallback, useMemo');
}

fs.writeFileSync('src/App.jsx', code);
