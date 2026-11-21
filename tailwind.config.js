export default { content: ['./index.html','./src/**/*.{ts,tsx}'], darkMode: ['selector', '[data-theme="dark"]'],
 theme:{extend:{fontFamily:{sans:['Inter','system-ui','sans-serif'],mono:['ui-monospace','SFMono-Regular','Menlo','monospace']},
 colors:{
  bg:'rgb(var(--c-bg) / <alpha-value>)', panel:'rgb(var(--c-panel) / <alpha-value>)', panel2:'rgb(var(--c-panel2) / <alpha-value>)',
  accent:'rgb(var(--c-accent) / <alpha-value>)', ink:'rgb(var(--c-ink) / <alpha-value>)', mute:'rgb(var(--c-mute) / <alpha-value>)',
  line:'rgb(var(--c-line) / <alpha-value>)', ok:'rgb(var(--c-ok) / <alpha-value>)'
 }}}}
