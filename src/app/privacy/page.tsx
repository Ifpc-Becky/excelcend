import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | ExcelCend",
  description: "ExcelCend のプライバシーポリシーページです。",
};

export default function PrivacyPage() {
  return <LegalPage title="プライバシーポリシー" description="ExcelCend のプライバシーポリシーです。" />;
}
