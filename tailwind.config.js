/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the --background variable from index.css
        background: "hsl(36, 83%, 95%)",    // Warm Cream #FDF3E7

        // Matches the --foreground variable from index.css
        foreground: "hsl(20, 9%, 33%)",     // Dark Warm Gray #5D534D

        primary: {
          // Matches the --primary variable from index.css
          DEFAULT: "hsl(13, 58%, 66%)",   // Muted Terracotta #D88C79
          // Matches the --primary-hover variable from index.css (typically a bit darker)
          hover: "hsl(13, 48%, 60%)",     // Darker Muted Terracotta #C77C6A
          // Matches the --primary-foreground variable from index.css
          foreground: "hsl(36, 83%, 95%)", // Warm Cream #FDF3E7
        },
        secondary: {
          // Matches the --secondary variable from index.css
          DEFAULT: "hsl(26, 83%, 77%)",   // Gentle Apricot #F5B892
          // Matches the --secondary-hover variable from index.css (typically a bit darker)
          hover: "hsl(26, 73%, 70%)",     // Darker Gentle Apricot #EAA87F
          // Matches the --secondary-foreground variable from index.css
          foreground: "hsl(20, 9%, 33%)",  // Dark Warm Gray #5D534D
        },
        muted: {
          // Matches the --muted variable from index.css
          DEFAULT: "hsl(33, 50%, 96%)",   // Very Light Warm Cream #F9F4EE
          // Matches the --muted-foreground variable from index.css
          foreground: "hsl(25, 13%, 62%)", // Medium-Light Warm Gray #A69B93
        },
        accent: { // Can be distinct or an alias
          // Matches the --accent variable from index.css (currently same as secondary)
          DEFAULT: "hsl(26, 83%, 77%)",   // Gentle Apricot #F5B892
          // Matches the --accent-foreground variable from index.css
          foreground: "hsl(20, 9%, 33%)",  // Dark Warm Gray #5D534D
        },
        card: {
          // Matches the --card variable from index.css
          DEFAULT: "hsl(27, 70%, 93%)",   // Light Peach #FAEBDD
          // Matches the --card-foreground variable from index.css
          foreground: "hsl(20, 9%, 33%)",  // Dark Warm Gray #5D534D
        },
        // Matches the --app-border variable from index.css
        // Consider renaming to 'border' for Tailwind convention if not conflicting,
        // or using it as `border-appBorder`
        appBorder: "hsl(35, 38%, 84%)",   // Subtle Warm Border #E5D9C9

        // Popover colors, ensuring they match the card for consistency with the "Warm Embrace" theme
        popover: {
            DEFAULT: "hsl(27, 70%, 93%)",   // Light Peach (same as card)
            foreground: "hsl(20, 9%, 33%)",  // Dark Warm Gray (same as card foreground)
        },
      },
      borderRadius: {
        'xl': '1rem', // Kept from your original
        '2xl': '1.5rem', // Kept from your original
        '3xl': '2rem',   // Kept from your original
      },
      boxShadow: {
        // Updated to use warm tones with opacity
        // Using hsla(H, S, L, Alpha) format
        // Foreground: 20 9% 33%
        // Primary: 13 58% 66%
        'soft': '0 4px 20px -2px hsla(20, 9%, 33%, 0.08)', // Softer shadow using foreground color
        'warm': '0 8px 30px -4px hsla(13, 58%, 66%, 0.12)',   // Warmer shadow using primary accent
      },
      animation: {
        'float': 'float 6s ease-in-out infinite', // Kept from your original
      },
      keyframes: {
        float: { // Kept from your original
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
};