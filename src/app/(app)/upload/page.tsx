import { Metadata } from "next";
import UploadClient from "./UploadClient";

export const metadata: Metadata = {
  title: "請求書アップロード | ExcelCend",
};

export default function UploadPage() {
  return <UploadClient />;
}
