sed -i 's/<div className="absolute top-6 right-6 z-10">/<div className="w-full max-w-4xl flex justify-end z-10 mb-4 md:absolute md:top-6 md:right-6 md:mb-0">/g' src/App.jsx
sed -i 's/className="flex flex-col items-center justify-center min-h-screen p-6 relative"/className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6 relative"/g' src/App.jsx
