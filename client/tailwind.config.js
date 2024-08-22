const {nextui} = require('@nextui-org/theme');
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/components/(checkbox|modal|pagination|popover|progress|slider|spinner|tabs|button|ripple).js"
  ],
  theme: {
    extend: {
      fontFamily: {
        "display": "var(--chivo), sans",
        "body": "var(--inter), sans"
      }
    },
  },
  safelist: [
    ...["red-600", "rose-600", "orange-600", "amber-600", "cyan-600", "green-600", "white"]
      .flatMap(x=> [`bg-${x}`, `text-${x}`, `stroke-${x}/10`, `stroke-${x}`]),
    "bg-blue-100"
  ],
  plugins: [nextui({
    layout: {
      disabledOpacity: "1.0"
    }
  })],
}