/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wompi: {
          primary: '#00D4AA', // Verde principal de Wompi
          primaryDark: '#00B894', // Verde oscuro
          primaryLight: '#00F5CC', // Verde claro
          secondary: '#1A1A2E', // Azul oscuro
          accent: '#16213E', // Azul medio
          text: '#2C3E50', // Gris oscuro para texto
        },
      },
    },
  },
  plugins: [],
}

