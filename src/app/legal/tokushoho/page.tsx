import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | ExcelCend",
  description: "ExcelCend の特定商取引法に基づく表記ページです。",
};

export default function TokushohoPage() {
  return <LegalPage title="特定商取引法に基づく表記" description="ExcelCend の特定商取引法に基づく表記です。" />;
}
