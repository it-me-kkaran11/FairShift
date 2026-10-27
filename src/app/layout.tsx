import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppContext';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'FairShift | Worker-First Workplace Fairness Intelligence Platform',
  description: 'Evidence-backed fairness intelligence for frontline workers and responsible employers. SDG 8 Decent Work and Economic Growth.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <AppProvider>
          <Navigation />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>
          <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">FairShift</span>
                <span>— Worker-First Workplace Fairness Platform</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-emerald-400 font-medium">SDG 8: Decent Work & Economic Growth</span>
                <span>Prompt Wars 2026</span>
                <span className="text-slate-500">Tamper-evident Audit Ledger • Zero Plaintext Secrets</span>
              </div>
            </div>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
