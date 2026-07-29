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
                background: '#FFFFFF',
                color: '#0F172A',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(15, 76, 58, 0.08)',
              },
              success: {
                iconTheme: { primary: '#1E7B45', secondary: '#FFFFFF' },
              },
              error: {
                iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
