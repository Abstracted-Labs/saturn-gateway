/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js" // Flowbite JS source template path
  ],
  theme: {
    extend: {
      colors: {
        saturn: {
          50: '#692EFF',
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

