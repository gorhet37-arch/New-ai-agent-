import './globals.css';
export const metadata = { title: 'ConvertAI — AI Lead Conversion', description: 'Convert visitors into customers automatically' };
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}
        <script dangerouslySetInnerHTML={{ __html:
          `const t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')` }} />
      </body>
    </html>
  );
}
