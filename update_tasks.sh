sed -i 's/let timeDisplay = null;/<TimerWrapper key={task.id}>\n                    {(now) => {\n                      let timeDisplay = null;/g' src/App.jsx

sed -i 's/                  );/                  );\n                    }}\n                  <\/TimerWrapper>\n                  );/g' src/App.jsx
