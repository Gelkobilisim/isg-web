const fs = require('fs');

let i18nCode = fs.readFileSync('src/i18n.js', 'utf8');
if (!i18nCode.includes('chart_violations:')) {
  i18nCode = i18nCode.replace('analysis_desc: "Günlük', 'chart_violations: "İhlal Dağılım Grafiği",\n    analysis_desc: "Günlük');
  i18nCode = i18nCode.replace('analysis_desc: "You can', 'chart_violations: "Violation Distribution Chart",\n    analysis_desc: "You can');
}
fs.writeFileSync('src/i18n.js', i18nCode);

let appCode = fs.readFileSync('src/App.jsx', 'utf8');

const oldChartStr = `<div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedAnalysis.map(item => ({ name: t(getDeptKey(item.name)), issues: item.count }))} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} angle={-45} textAnchor="end" />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                                <Tooltip cursor={{fill: darkMode ? '#1F2937' : '#F3F4F6'}} contentStyle={{backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} itemStyle={{color: '#6366F1', fontWeight: 'bold'}} labelStyle={{color: darkMode ? '#D1D5DB' : '#374151', fontWeight: 'bold', marginBottom: '4px'}} />
                                <Bar dataKey="issues" name={t('issues') || 'İhlal Sayısı'} radius={[4, 4, 0, 0]}>`;

const newChartStr = `<div className="w-full overflow-x-auto pb-2">
                        <div className="h-80 min-w-[500px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={sortedAnalysis.map(item => ({ name: t(getDeptKey(item.name)), issues: item.count }))} margin={{ top: 10, right: 10, left: -20, bottom: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#E5E7EB'} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} angle={-45} textAnchor="end" />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 11 }} />
                                    <Tooltip cursor={{fill: darkMode ? '#1F2937' : '#F3F4F6'}} contentStyle={{backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} itemStyle={{color: '#6366F1', fontWeight: 'bold'}} labelStyle={{color: darkMode ? '#D1D5DB' : '#374151', fontWeight: 'bold', marginBottom: '4px'}} formatter={(value) => [value, t('issues') || 'İhlal']} />
                                    <Bar dataKey="issues" name={t('issues') || 'İhlal'} radius={[4, 4, 0, 0]}>`;

appCode = appCode.replace(oldChartStr, newChartStr);

appCode = appCode.replace('Sıfırla ve Geçmişe Kaydet', "{t('save_history') || 'Sıfırla ve Geçmişe Kaydet'}");
appCode = appCode.replace('Puanları Sıfırla ve Kaydet', "{t('save_history_title') || 'Puanları Sıfırla ve Kaydet'}");
appCode = appCode.replace('Geçerli ayın puan durumu geçmişe kaydedilecek ve tüm departmanların puanları yeniden 100 olarak <b className="text-orange-600">sıfırlanacaktır.</b>', "{t('save_history_desc') || 'Geçerli ayın puan durumu geçmişe kaydedilecek ve tüm departmanların puanları yeniden 100 olarak sıfırlanacaktır.'}");
appCode = appCode.replace("'Sıfırla ve Kaydet'", "{t('save_btn_confirm') || 'Sıfırla ve Kaydet'}");

fs.writeFileSync('src/App.jsx', appCode);

i18nCode = fs.readFileSync('src/i18n.js', 'utf8');
i18nCode = i18nCode.replace('analysis_desc: "Günlük', 'save_history: "Sıfırla ve Geçmişe Kaydet",\n    save_history_title: "Puanları Sıfırla ve Kaydet",\n    save_history_desc: "Geçerli ayın puan durumu geçmişe kaydedilecek ve tüm departmanların puanları yeniden 100 olarak sıfırlanacaktır.",\n    save_btn_confirm: "Sıfırla ve Kaydet",\n    analysis_desc: "Günlük');
i18nCode = i18nCode.replace('analysis_desc: "You can', 'save_history: "Reset & Save to History",\n    save_history_title: "Reset & Save Scores",\n    save_history_desc: "Current month\'s scores will be saved to history and all department scores will be reset to 100.",\n    save_btn_confirm: "Reset & Save",\n    analysis_desc: "You can');
fs.writeFileSync('src/i18n.js', i18nCode);
