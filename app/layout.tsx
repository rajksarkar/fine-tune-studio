import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fine-Tune Studio",
  description: "Orchestrate OpenAI fine-tuning for GPT-3.5-turbo and other supported models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <nav className="bg-gray-900 text-white p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Fine-Tune Studio</h1>
            <div className="flex gap-4">
              <a href="/convert" className="hover:text-gray-300">Convert</a>
              <a href="/train" className="hover:text-gray-300">Train</a>
              <a href="/test" className="hover:text-gray-300">Test</a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
