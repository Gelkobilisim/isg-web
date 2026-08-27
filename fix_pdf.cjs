const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldExport = `    const handleExportPDF = () => {
        const element = document.getElementById('analysis-report-container');
        if (!element) return;
        
        const buttonsToHide = element.querySelectorAll('.print\\\\:hidden');
        buttonsToHide.forEach(btn => btn.style.display = 'none');
        
        // Remove styling that causes scrollbars/fixed heights in pdf
        const originalHeight = element.style.height;
        const originalOverflow = element.style.overflow;
        element.style.height = 'auto';
        element.style.overflow = 'visible';

        const opt = {
          margin:       10,
          filename:     'Analiz_Raporu.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, logging: false },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            buttonsToHide.forEach(btn => btn.style.display = '');
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
        });
    };`;

const newExport = `    const handleExportPDF = () => {
        // html2canvas (used by html2pdf) crashes with Tailwind v4 'oklch' colors.
        // The most robust solution is using the native browser print,
        // which natively supports all CSS and provides vector text in PDF.
        window.print();
    };`;

code = code.replace(oldExport, newExport);

// TopBar fix
code = code.replace(
  '<header className="bg-white dark:bg-gray-800 px-6 py-3 shadow-sm flex justify-between items-center sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">',
  '<header className="print:hidden bg-white dark:bg-gray-800 px-6 py-3 shadow-sm flex justify-between items-center sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700">'
);

// AdminDashboard header fix
code = code.replace(
  '<div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">',
  '<div className="print:hidden bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">'
);

// We need to also add print:hidden to the main layout padding if it has any, but flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 has padding which is fine.
// Wait, the body has bg-gray-50 which is fine. 

// There's a <main> tag in App return, we don't need to change it, it's just a flex container.

fs.writeFileSync('src/App.jsx', code);
