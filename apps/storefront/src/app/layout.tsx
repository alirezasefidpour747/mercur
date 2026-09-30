import { Toaster } from '@medusajs/ui';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { direction, language } from '../../../../shared/p01/messages';

import './globals.css';
import '../../../../shared/p01/styles.css';

export const metadata: Metadata = {
  title: { template: '%s | Didar', default: 'Didar' },
  description: 'Didar B2B catalog'
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = language((await headers()).get('x-didar-language') ?? 'fa');
  return (
    <html
      lang={lang}
      dir={direction(lang)}
    >
      <body className="bg-primary text-secondary antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
