module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#74b9ff',
        accent: '#ffeaa7',
        danger: '#ff7675'
      },
      fontFamily: {
        display: ['"SF Pro Display"', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
