const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add html2pdf import
if (!code.includes("import html2pdf")) {
    code = code.replace("import { initializeApp", "import html2pdf from 'html2pdf.js';\nimport { initializeApp");
}

// 2. Add handleExportPDF function inside App component, maybe right after renderRightPanel declaration
const funcDef = `
    const handleExportPDF = () => {
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
    };
`;

if (!code.includes("const handleExportPDF")) {
    code = code.replace("const renderRightPanel = () => {", "const renderRightPanel = () => {" + funcDef);
}

// 3. Replace window.print() with handleExportPDF()
code = code.replaceAll("onClick={() => window.print()}", "onClick={handleExportPDF}");

// 4. Add id="analysis-report-container" to the two analysis divs.
code = code.replace(
    /className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0 print:h-auto print:block"/,
    'id="analysis-report-container" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0 print:h-auto print:block"'
);
code = code.replace(
    /className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0"/,
    'id="analysis-report-container" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-slide-up h-full flex flex-col print:shadow-none print:border-none print:p-0"'
);

fs.writeFileSync('src/App.jsx', code);
