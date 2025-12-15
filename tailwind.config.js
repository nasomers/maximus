/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			success: {
  				DEFAULT: '#22c55e',
  				foreground: '#fafafa'
  			},
  			warning: {
  				DEFAULT: '#eab308',
  				foreground: '#0a0a0b'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'monospace'
  			]
  		},
  		keyframes: {
  			'glow-pulse': {
  				'0%, 100%': {
  					boxShadow: '0 0 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1)'
  				},
  				'50%': {
  					boxShadow: '0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)'
  				}
  			},
  			'glow-success': {
  				'0%, 100%': {
  					boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)'
  				}
  			},
  			'glow-error': {
  				'0%, 100%': {
  					boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)'
  				},
  				'50%': {
  					boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)'
  				}
  			},
  			'fade-in': {
  				'0%': { opacity: '0', transform: 'translateY(-10px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'slide-in-right': {
  				'0%': { opacity: '0', transform: 'translateX(20px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' }
  			},
  			'scale-in': {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			}
  		},
  		animation: {
  			'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
  			'glow-success': 'glow-success 1s ease-in-out',
  			'glow-error': 'glow-error 1s ease-in-out',
  			'fade-in': 'fade-in 0.2s ease-out',
  			'slide-in-right': 'slide-in-right 0.2s ease-out',
  			'scale-in': 'scale-in 0.15s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
