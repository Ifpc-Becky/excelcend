import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "利用規約 | ExcelCend",
  description: "ExcelCend の利用規約ページです。",
};

export default function TermsPage() {
  return <LegalPage title="利用規約" description="ExcelCend の利用規約です。" />;
}
