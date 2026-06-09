import Link from "next/link";

const legalLinks = [
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/legal/tokushoho", label: "特定商取引法に基づく表記" },
];

export default function LegalFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">© 2025 ExcelCend. All rights reserved.</p>
        <nav aria-label="法務関連リンク" className="flex flex-wrap gap-x-5 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-600 hover:underline">
              {link.label}
            </Link>
          ))}
          <a href="mailto:support@excelcend.com" className="hover:text-blue-600 hover:underline">
            お問い合わせ（support@excelcend.com）
          </a>
        </nav>
      </div>
    </footer>
  );
}
