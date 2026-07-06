import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '../providers/query-provider';
import { ThemeProvider } from '../providers/theme-provider';
import { AuthProvider } from '../providers/auth-provider';
import { LayoutShell } from '../components/layout/layout-shell';
import { ToastContainer } from '../components/feedback/toasts';
import { ErrorBoundary } from '../components/layout/error-boundary';
import { LiveProvider } from '../lib/live/LiveProvider';
import { PreferencesProvider } from '../providers/preferences-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TaskFlow | Distributed Job Scheduler Admin Console',
  description: 'Enterprise operations dashboard for Distributed Job Scheduler.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <PreferencesProvider>
                <AuthProvider>
                  <LiveProvider>
                    <LayoutShell>{children}</LayoutShell>
                    <ToastContainer />
                  </LiveProvider>
                </AuthProvider>
              </PreferencesProvider>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
