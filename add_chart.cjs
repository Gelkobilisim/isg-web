const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const chartCode = `
                <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 print:break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('chart_violations') || 'İhlal Dağılım Grafiği'}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedAnalysis.map(item => ({ name: t(getDeptKey(item.name)), issues: item.count }))} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} angle={-45} textAnchor="end" />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                                <Tooltip cursor={{fill: darkMode ? '#1F2937' : '#F3F4F6'}} contentStyle={{backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} itemStyle={{color: '#6366F1', fontWeight: 'bold'}} labelStyle={{color: darkMode ? '#D1D5DB' : '#374151', fontWeight: 'bold', marginBottom: '4px'}} />
                                <Bar dataKey="issues" name={t('issues') || 'İhlal Sayısı'} radius={[4, 4, 0, 0]}>
                                    {sortedAnalysis.map((entry, index) => (
                                        <Cell key={\`cell-\${index}\`} fill={entry.count > 0 ? (index === 0 ? '#EF4444' : '#6366F1') : '#9CA3AF'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
`;

// Insert it right before: <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">
code = code.replace('<div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">', chartCode + '\n                <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible">');
fs.writeFileSync('src/App.jsx', code);
