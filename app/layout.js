export const metadata = {
  title: 'Story Maker',
  description: 'MVP: projects, writing, corkboard, research',
};

import './globals.css';
import { CustomElementsGuard } from "@/components/custom-elements-guard";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <CustomElementsGuard />
        <div id="app" className="app">{children}</div>
      </body>
    </html>
  );
}
