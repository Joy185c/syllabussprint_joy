import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Navbar } from '@/components/ui/navbar';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SyllabusSprint — AI Academic Planner',
    template: '%s | SyllabusSprint',
  },
  description:
    'Upload your university syllabus and instantly generate a visual Kanban board, study timeline, assignment tracker, and exam schedule — powered by AI.',
  keywords: ['syllabus', 'academic planner', 'AI', 'kanban', 'study timeline', 'university'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#1e1b4b',
                color: '#e0e7ff',
                border: '1px solid #4f46e5',
                borderRadius: '12px',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
