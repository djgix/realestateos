/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      colors: {
        brand:    { 50:'#f0f4ff', 100:'#e0e9ff', 400:'#7b94ff', 500:'#4f6ef7', 600:'#3a52e8', 900:'#1e2a87' },
        landlord: { DEFAULT:'#4f6ef7', light:'#e0e9ff', dark:'#2535aa' },
        seller:   { DEFAULT:'#16a34a', light:'#dcfce7', dark:'#15803d' },
        buyer:    { DEFAULT:'#ea580c', light:'#ffedd5', dark:'#c2410c' },
      },
      animation: {
        'fade-up':  'fadeUp 0.6s ease forwards',
        'fade-in':  'fadeIn 0.4s ease forwards',
        'float':    'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { from:{ opacity:0, transform:'translateY(20px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn:  { from:{ opacity:0 }, to:{ opacity:1 } },
        float:   { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-12px)' } },
      },
    },
  },
  plugins: [],
}
