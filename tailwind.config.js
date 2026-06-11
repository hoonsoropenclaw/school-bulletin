/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 公務色 - 深藍灰主色 + 暖橘 accent
        ink: {
          50: '#f5f6f8',
          100: '#e8eaef',
          200: '#cdd2dc',
          300: '#a3acbf',
          400: '#737e96',
          500: '#525c75',
          600: '#3f4761',
          700: '#2e3548',
          800: '#1f2535',
          900: '#141826',
        },
        accent: {
          50: '#fff8ef',
          100: '#fdecd5',
          200: '#fbd5a3',
          300: '#f7b86c',
          400: '#f1963d',
          500: '#e87919',
          600: '#cc5d10',
          700: '#a3440f',
          800: '#7d3614',
          900: '#5b2810',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', '"PingFang TC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 24, 38, 0.04), 0 1px 3px rgba(20, 24, 38, 0.06)',
      },
    },
  },
  plugins: [],
};
