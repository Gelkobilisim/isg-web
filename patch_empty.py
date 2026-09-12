import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

old_empty = """                {displayTasks.length === 0 && (
                    <div className="col-span-full bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center mt-2">
                        <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mb-6">
                            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Harika! Biriminizde hiç ihlal yok.</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Şu an için her şey yolunda görünüyor. İş sağlığı ve güvenliği kurallarına gösterdiğiniz özen için teşekkür ederiz. Güvenli çalışmalar dileriz!</p>
                    </div>
                )}"""

new_empty = """                {displayTasks.length === 0 && (
                    <div className="col-span-full bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center mt-2">
                        {activeTab === 'open' ? (
                            <>
                                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-full mb-6">
                                    <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Harika! Biriminizde açık ihlal yok.</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Şu an için her şey yolunda görünüyor. İş sağlığı ve güvenliği kurallarına gösterdiğiniz özen için teşekkür ederiz. Güvenli çalışmalar dileriz!</p>
                            </>
                        ) : (
                            <>
                                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-full mb-6">
                                    <List className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">Henüz geçmiş bir ihlal kaydı yok.</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">Tamamlanan veya düzeltilen ihlalleriniz burada listelenecektir.</p>
                            </>
                        )}
                    </div>
                )}"""

content = content.replace(old_empty, new_empty)

with open('src/App.jsx', 'w') as f:
    f.write(content)
