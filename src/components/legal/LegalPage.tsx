import Link from "next/link";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export default function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">
          トップへ戻る
        </Link>
        <header className="mt-6 border-b border-slate-100 pb-6">
          <p className="text-sm font-semibold text-blue-600">ExcelCend</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
        </header>
        <section className="prose prose-slate mt-8 max-w-none prose-h2:mt-8 prose-h2:text-xl prose-h2:font-bold prose-p:leading-7">
          {children}
        </section>
      </article>
    </main>
  );
}
