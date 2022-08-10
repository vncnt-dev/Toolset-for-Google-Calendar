/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        gctlight: {
          "primary": "#0d6efd",
          "secondary": "#6c757d",
          "accent": "#37CDBE",
          "neutral": "#3D4451",
          "base-100": "#f1f3f4",
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#dc3545",
        },
      },
    ], /* https://daisyui.com/docs/themes/ */
  },
}