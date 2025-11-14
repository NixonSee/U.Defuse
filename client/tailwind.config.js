/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'borderPulse': 'borderPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        borderPulse: {
          '0%': { 
            boxShadow: '0 0 5px rgba(255, 255, 0, 0.3), 0 0 10px rgba(255, 255, 0, 0.2), 0 0 15px rgba(255, 255, 0, 0.1)',
            borderColor: 'rgba(255, 255, 0, 0.3)'
          },
          '100%': { 
            boxShadow: '0 0 10px rgba(255, 255, 0, 0.5), 0 0 20px rgba(255, 255, 0, 0.3), 0 0 30px rgba(255, 255, 0, 0.2)',
            borderColor: 'rgba(255, 255, 0, 0.6)'
          },
        }
      }
    },
  },
  plugins: [],
}