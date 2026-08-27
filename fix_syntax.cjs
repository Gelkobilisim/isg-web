const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The original closing was:
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </div>
//                 </div>

// I changed the opening to have TWO divs instead of ONE.
// So I need to replace the closing portion to have THREE divs closing, 
// because it used to be two divs closing! (h-64 and mb-8 p-4 bg-gray-50...)
// Wait! Let's check how many divs it had.

const fixClosing = `                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>`;

const newClosing = `                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>`;

code = code.replace(fixClosing, newClosing);
fs.writeFileSync('src/App.jsx', code);
