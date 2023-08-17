/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js" // Flowbite JS source template path
  ],
  theme: {
    extend: {
      colors: {
        saturn: {
          'purple': '#692EFF', // purple
          'white': '#FFFFFF', // white
          'offwhite': '#F9F9FB', // off white
          'black': '#010101', // black
          'dgrey': '#0E0D11', // dark grey
          'lgrey': '#888893', // light grey
          'green': '#6FE388', // green success
          'red': '#E36F6F', // red error
          'yellow': '#ECC265', // yellow
        },
      },
      fontFamily: {
        'sans': [ 'Inter', 'ui-sans-serif', 'system-ui' ],
      },
    },
    screens: {
      xs: '320px',
      sm: '480px',
      md: '768px',
      lg: '976px',
      xl: '1440px',
    },
  },
  plugins: [
    require('flowbite/plugin') // require Flowbite's plugin for Tailwind CSS
  ],
}

