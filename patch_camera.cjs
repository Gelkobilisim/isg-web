const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. preLoadCamera
code = code.replace(
  '<div onClick={() => document.getElementById(\'preLoadCamera\').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">',
  '<label htmlFor="preLoadCamera" className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">'
);
code = code.replace(
  '<span className="text-sm font-bold">{t(\'cam_open\')}</span><span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t(\'optional\')}</span></>\n                  )}\n                </div>',
  '<span className="text-sm font-bold">{t(\'cam_open\')}</span><span className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t(\'optional\')}</span></>\n                  )}\n                </label>'
);

// 2. postLoadCamera
code = code.replace(
  '<div onClick={() => document.getElementById(\'postLoadCamera\').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">',
  '<label htmlFor="postLoadCamera" className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">'
);
code = code.replace(
  '<span className="text-sm font-bold">{t(\'cam_open\')}</span></>\n                    )}\n                  </div>',
  '<span className="text-sm font-bold">{t(\'cam_open\')}</span></>\n                    )}\n                  </label>'
);

// 3. modCamera
code = code.replace(
  '<div onClick={() => document.getElementById(\'modCamera\').click()} className="w-full h-48 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">',
  '<label htmlFor="modCamera" className="w-full h-48 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 cursor-pointer transition-colors group overflow-hidden">'
);
code = code.replace(
  '<span className="text-sm font-bold">{t(\'cam_open\') || \'Kamerayı Aç / Fotoğraf Yükle\'}</span></>\n                            )}\n                        </div>',
  '<span className="text-sm font-bold">{t(\'cam_open\') || \'Kamerayı Aç / Fotoğraf Yükle\'}</span></>\n                            )}\n                        </label>'
);

// 4. sefCamera
code = code.replace(
  '<div onClick={() => document.getElementById(\'sefCamera\').click()} className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-colors group overflow-hidden">',
  '<label htmlFor="sefCamera" className="w-full h-40 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-colors group overflow-hidden">'
);
code = code.replace(
  '<span className="text-sm font-bold">{t(\'open_camera\') || \'Kamerayı Aç\'}</span></>\n                                        )}\n                                    </div>',
  '<span className="text-sm font-bold">{t(\'open_camera\') || \'Kamerayı Aç\'}</span></>\n                                        )}\n                                    </label>'
);

fs.writeFileSync('src/App.jsx', code);
