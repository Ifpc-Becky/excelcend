"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  FileSpreadsheet,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
  RefreshCw,
  Mail,
  Send,
} from "lucide-react";

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
type UploadStatus  = "idle" | "uploading"  | "success" | "error";
type ConvertStatus = "idle" | "converting" | "success" | "error";
type EmailStatus   = "idle" | "sending"    | "success" | "error";

interface SelectedFile {
  file: File;
  preview: string;
}

interface CustomerOption {
  id: string;
  company_name: string;
  email: string;
}

interface MailTemplate {
  subject_template: string | null;
  body_template: string;
}

// -------------------------------------------------------
// 定数
// -------------------------------------------------------
const ACCEPTED_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls"];
const MAX_SIZE_MB = 20;

// -------------------------------------------------------
// ユーティリティ
// -------------------------------------------------------
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const validExt = ACCEPTED_EXTENSIONS.includes(ext);
  const validType = ACCEPTED_TYPES.includes(file.type) || validExt;
  if (!validType) return "対応ファイルは .xlsx / .xls のみです。";
  if (file.size > MAX_SIZE_MB * 1024 * 1024)
    return `ファイルサイズは ${MAX_SIZE_MB}MB 以下にしてください。`;
  return null;
}

// -------------------------------------------------------
// ステップインジケーター（4ステップ）
// -------------------------------------------------------
function StepIndicator({
  uploadStatus,
  convertStatus,
  emailStatus,
}: {
  uploadStatus:  UploadStatus;
  convertStatus: ConvertStatus;
  emailStatus:   EmailStatus;
}) {
  const steps = [
    {
      label: "アップロード",
      done:   uploadStatus  === "success",
      active: uploadStatus  === "uploading",
    },
    {
      label: "PDF変換",
      done:   convertStatus === "success",
      active: convertStatus === "converting",
    },
    {
      label: "メール送信",
      done:   emailStatus   === "success",
      active: emailStatus   === "sending",
    },
    {
      label: "完了",
      done:   emailStatus   === "success",
      active: false,
    },
  ];

  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : step.active
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {step.done ? (
                <CheckCircle2 size={16} />
              ) : step.active ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                step.done
                  ? "text-emerald-600"
                  : step.active
                  ? "text-blue-700"
                  : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-10 sm:w-16 mx-1.5 mb-5 rounded transition-all duration-500 ${
                steps[i].done ? "bg-emerald-400" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------
// 完了ステップ表示用の小カード
// -------------------------------------------------------
function CompletedStep({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-400 font-mono truncate mt-0.5" title={detail}>
            {detail}
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// エラーカード
// -------------------------------------------------------
function ErrorCard({
  title,
  message,
  onRetry,
  onReset,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  onReset: () => void;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-2.5 text-sm text-red-600">
        <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
        <div>
          <p className="font-medium mb-1">{title}</p>
          <p className="text-red-500 text-xs mb-3">{message}</p>
          <div className="flex gap-2">
            {onRetry && (
              <button onClick={onRetry} className="btn-secondary text-xs">
                <RefreshCw size={13} />
                再試行
              </button>
            )}
            <button
              onClick={onReset}
              className="text-xs text-slate-400 hover:text-slate-600 transition"
            >
              最初からやり直す
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// メインコンポーネント
// -------------------------------------------------------
export default function UploadClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // ファイル選択
  const [isDragging,       setIsDragging]       = useState(false);
  const [selected,         setSelected]         = useState<SelectedFile | null>(null);
  const [validationError,  setValidationError]  = useState<string | null>(null);

  // アップロード
  const [uploadStatus,   setUploadStatus]   = useState<UploadStatus>("idle");
  const [uploadError,    setUploadError]    = useState<string | null>(null);
  const [uploadedPath,   setUploadedPath]   = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // PDF変換
  const [convertStatus, setConvertStatus] = useState<ConvertStatus>("idle");
  const [convertError,  setConvertError]  = useState<string | null>(null);
  const [pdfPath,       setPdfPath]       = useState<string | null>(null);

  // メール送信
  const DEFAULT_COMPANY = "株式会社イフペック";
  const buildSubject = (company: string) => `${company}より請求書を送付いたしました`;

  const [emailStatus,     setEmailStatus]     = useState<EmailStatus>("idle");
  const [emailError,      setEmailError]       = useState<string | null>(null);
  const [emailTo,         setEmailTo]          = useState("");
  const [companyName,     setCompanyName]      = useState(DEFAULT_COMPANY);
  const [emailSubject,    setEmailSubject]     = useState(buildSubject(DEFAULT_COMPANY));
  const [isSubjectEdited, setIsSubjectEdited]  = useState(false);
  const [emailBody,       setEmailBody]        = useState(""); // テンプレート本文
  const [isBodyEdited,    setIsBodyEdited]     = useState(false); // 手動編集フラグ
  const [sentTo,          setSentTo]           = useState<string | null>(null);
  const [sentCompany,     setSentCompany]      = useState<string | null>(null);

  // テンプレート（件名・本文のプレースホルダー元）
  const [mailTemplate, setMailTemplate] = useState<MailTemplate | null>(null);

  // 顧客選択ドロップダウン
  const [customers,        setCustomers]        = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");

  // マウント時: テンプレートと顧客を並行取得
  useEffect(() => {
    // テンプレート取得
    fetch("/api/mail-templates")
      .then((r) => r.ok ? r.json() : null)
      .then((tpl: MailTemplate | null) => {
        if (!tpl) return;
        setMailTemplate(tpl);
        // 件名: 手動編集していない場合のみ反映
        if (tpl.subject_template && !isSubjectEdited) {
          setEmailSubject(
            tpl.subject_template.replace(/\{companyName\}/g, DEFAULT_COMPANY)
          );
        }
        // 本文: 手動編集していない場合のみ反映
        if (!isBodyEdited) {
          setEmailBody(
            tpl.body_template.replace(/\{companyName\}/g, DEFAULT_COMPANY)
          );
        }
      })
      .catch(() => {});

    // 顧客取得
    fetch("/api/customers")
      .then((r) => r.ok ? r.json() : [])
      .then((data: CustomerOption[]) => setCustomers(data))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------
  // ファイル選択
  // -------------------------------------------------------
  const selectFile = useCallback((file: File) => {
    const err = isValidFile(file);
    if (err) {
      setValidationError(err);
      setSelected(null);
      return;
    }
    setValidationError(null);
    setUploadStatus("idle");   setUploadError(null);   setUploadedPath(null); setUploadProgress(0);
    setConvertStatus("idle");  setConvertError(null);  setPdfPath(null);
    setEmailStatus("idle");    setEmailError(null);    setSentTo(null);       setSentCompany(null);
    setSelected({ file, preview: formatBytes(file.size) });
  }, []);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  };
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    e.target.value = "";
  };

  const resetAll = () => {
    setSelected(null);        setValidationError(null);
    setUploadStatus("idle");  setUploadError(null);   setUploadedPath(null); setUploadProgress(0);
    setConvertStatus("idle"); setConvertError(null);  setPdfPath(null);
    setEmailStatus("idle");   setEmailError(null);    setSentTo(null);       setSentCompany(null);
    setEmailTo("");
    setCompanyName(DEFAULT_COMPANY);
    setEmailSubject(buildSubject(DEFAULT_COMPANY));
    setIsSubjectEdited(false);
    setEmailBody(
      mailTemplate
        ? mailTemplate.body_template.replace(/\{companyName\}/g, DEFAULT_COMPANY)
        : ""
    );
    setIsBodyEdited(false);
    setSelectedCustomer("");
  };

  // -------------------------------------------------------
  // アップロード処理
  // -------------------------------------------------------
  const handleUpload = async () => {
    if (!selected) return;
    setUploadStatus("uploading");
    setUploadError(null);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const timestamp = Date.now();
      const safeName = selected.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storagePath = `uploads/${user.id}/${timestamp}_${safeName}`;

      const progressInterval = setInterval(() => {
        setUploadProgress((p) => (p < 85 ? p + Math.random() * 15 : p));
      }, 200);

      const { error } = await supabase.storage
        .from("source-files")
        .upload(storagePath, selected.file, {
          cacheControl: "3600",
          upsert: false,
          contentType: selected.file.type || "application/octet-stream",
        });

      clearInterval(progressInterval);

      if (error) {
        if (error.message.includes("Bucket not found") || error.message.includes("bucket")) {
          throw new Error('"source-files" バケットが見つかりません。Supabaseダッシュボードで作成してください。');
        }
        throw new Error(error.message);
      }

      setUploadProgress(100);
      setUploadedPath(storagePath);
      setUploadStatus("success");
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err instanceof Error ? err.message : "アップロード中にエラーが発生しました。");
      setUploadProgress(0);
    }
  };

  // -------------------------------------------------------
  // PDF変換処理
  // -------------------------------------------------------
  const handleConvert = async () => {
    if (!uploadedPath || !selected) return;
    setConvertStatus("converting");
    setConvertError(null);
    setPdfPath(null);

    try {
      const res = await fetch("/api/convert-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourcePath: uploadedPath, fileName: selected.file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "PDF変換に失敗しました");
      setPdfPath(data.pdfPath);
      setConvertStatus("success");
    } catch (err) {
      setConvertStatus("error");
      setConvertError(err instanceof Error ? err.message : "PDF変換中にエラーが発生しました。");
    }
  };

  // -------------------------------------------------------
  // メール送信処理
  // -------------------------------------------------------
  const handleSendEmail = async () => {
    if (!pdfPath || !selected) return;

    const companyTrimmed = companyName.trim();
    const toTrimmed      = emailTo.trim();
    const subjectTrimmed = emailSubject.trim();

    if (!companyTrimmed) {
      setEmailError("送信元会社名を入力してください。");
      return;
    }
    if (!toTrimmed) {
      setEmailError("送信先メールアドレスを入力してください。");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toTrimmed)) {
      setEmailError("メールアドレスの形式が正しくありません。");
      return;
    }
    if (!subjectTrimmed) {
      setEmailError("件名を入力してください。");
      return;
    }

    setEmailStatus("sending");
    setEmailError(null);

    const pdfFileName = selected.file.name.replace(/\.[^.]+$/, "") + ".pdf";

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:          toTrimmed,
          subject:     subjectTrimmed,
          pdfPath,
          fileName:    pdfFileName,
          companyName: companyTrimmed,
          sourcePath:  uploadedPath ?? "",
          emailBody:   emailBody.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "メール送信に失敗しました");

      setSentTo(toTrimmed);
      setSentCompany(companyTrimmed);
      setEmailStatus("success");
    } catch (err) {
      setEmailStatus("error");
      setEmailError(err instanceof Error ? err.message : "メール送信中にエラーが発生しました。");
    }
  };

  // -------------------------------------------------------
  // 表示状態
  // -------------------------------------------------------
  const showUploadForm  = uploadStatus !== "success";
  const showPostUpload  = uploadStatus === "success";
  const showStepIndicator =
    uploadStatus === "uploading" ||
    uploadStatus === "success"   ||
    convertStatus !== "idle"     ||
    emailStatus !== "idle";

  // -------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ページヘッダー */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          請求書アップロード
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          ExcelをアップロードしてPDFに変換、メールで送付するまで一括で行えます
        </p>
      </div>

      {/* ステップインジケーター */}
      {showStepIndicator && (
        <div className="card px-6 py-5 flex justify-center overflow-x-auto">
          <StepIndicator
            uploadStatus={uploadStatus}
            convertStatus={convertStatus}
            emailStatus={emailStatus}
          />
        </div>
      )}

      {/* ===== アップロードフォーム ===== */}
      {showUploadForm && (
        <>
          {/* ドロップゾーン */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !selected && inputRef.current?.click()}
            className={`card transition-all duration-200 ${
              selected
                ? "p-6 cursor-default"
                : `p-12 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed ${
                    isDragging
                      ? "border-blue-400 bg-blue-50/60 scale-[1.01]"
                      : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
                  }`
            }`}
          >
            {selected ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {selected.file.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selected.preview} ・ {selected.file.name.split(".").pop()?.toUpperCase()}ファイル
                  </p>
                  {uploadStatus === "uploading" && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        アップロード中... {Math.round(uploadProgress)}%
                      </p>
                    </div>
                  )}
                </div>
                {uploadStatus !== "uploading" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); resetAll(); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex-shrink-0"
                    title="選択を解除"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors ${isDragging ? "bg-blue-100" : "bg-slate-100"}`}>
                  <UploadCloud size={28} className={isDragging ? "text-blue-500" : "text-slate-400"} />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {isDragging ? "ここにドロップしてください" : "ファイルをドラッグ＆ドロップ"}
                </p>
                <p className="text-xs text-slate-400 mb-5">
                  または
                  <span className="text-blue-600 font-medium mx-1 hover:underline">
                    クリックしてファイルを選択
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {[".xlsx", ".xls"].map((ext) => (
                    <span key={ext} className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                      {ext}
                    </span>
                  ))}
                  <span className="text-xs text-slate-400">最大 {MAX_SIZE_MB}MB</span>
                </div>
              </>
            )}
          </div>

          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={onInputChange} className="hidden" />

          {/* バリデーションエラー */}
          {validationError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
              {validationError}
            </div>
          )}

          {/* アップロードエラー */}
          {uploadStatus === "error" && uploadError && (
            <ErrorCard
              title="アップロードに失敗しました"
              message={uploadError}
              onRetry={handleUpload}
              onReset={resetAll}
            />
          )}

          {/* アクション */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => inputRef.current?.click()} className="btn-secondary">
              <FileText size={15} />
              ファイルを選択
            </button>
            <button
              onClick={handleUpload}
              disabled={!selected || uploadStatus === "uploading"}
              className="btn-primary"
            >
              {uploadStatus === "uploading" ? (
                <><Loader2 size={15} className="animate-spin" />アップロード中...</>
              ) : (
                <><UploadCloud size={15} />アップロード</>
              )}
            </button>
          </div>

          {/* ヘルプ */}
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1.5">💡 使い方</p>
            <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
              <li>Excelで作成した請求書ファイルを選択</li>
              <li>アップロード → PDF変換 → メール送信の順で進めます</li>
              <li>送信先メールアドレスは変換完了後に入力できます</li>
            </ol>
          </div>
        </>
      )}

      {/* ===== アップロード完了後フロー ===== */}
      {showPostUpload && (
        <div className="space-y-4">

          {/* ✅ アップロード完了 */}
          <CompletedStep label="アップロード完了" detail={uploadedPath ?? ""} />

          {/* ✅ PDF変換完了（済みの場合） */}
          {convertStatus === "success" && pdfPath && (
            <CompletedStep label="PDF変換完了" detail={pdfPath} />
          )}

          {/* ─── PDF変換 — idle ─── */}
          {convertStatus === "idle" && (
            <div className="card p-7 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <svg className="text-blue-600" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mb-1">PDFに変換しますか？</h2>
              <p className="text-sm text-slate-500 mb-6">
                LibreOfficeを使ってExcelをPDFに変換します。<br />
                変換には数秒〜数十秒かかる場合があります。
              </p>
              <div className="flex gap-3">
                <button onClick={resetAll} className="btn-secondary">
                  <RefreshCw size={15} />
                  別のファイルをアップロード
                </button>
                <button onClick={handleConvert} className="btn-primary">
                  PDFに変換
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ─── PDF変換 — converting ─── */}
          {convertStatus === "converting" && (
            <div className="card p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Loader2 size={26} className="text-blue-500 animate-spin" />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mb-1">PDF変換中...</h2>
              <p className="text-sm text-slate-500">LibreOfficeで変換しています。しばらくお待ちください。</p>
            </div>
          )}

          {/* ─── PDF変換 — error ─── */}
          {convertStatus === "error" && convertError && (
            <ErrorCard
              title="PDF変換に失敗しました"
              message={convertError}
              onRetry={handleConvert}
              onReset={resetAll}
            />
          )}

          {/* ─── メール送信フォーム（PDF変換成功後） ─── */}
          {convertStatus === "success" && emailStatus === "idle" && (
            <div className="card p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">PDFをメールで送信</h2>
                  <p className="text-xs text-slate-400">送信元会社名・送信先・件名を確認してください</p>
                </div>
              </div>

              <div className="space-y-4">

                {/* 0. 顧客を選択（任意） */}
                {customers.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      顧客を選択
                      <span className="text-slate-400 font-normal ml-1">（任意）</span>
                    </label>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => {
                        const id  = e.target.value;
                        setSelectedCustomer(id);
                        setEmailError(null);
                        if (!id) return;
                        const c = customers.find((c) => c.id === id);
                        if (!c) return;
                        // 会社名・メール自動入力
                        setEmailTo(c.email);
                        setCompanyName(c.company_name);
                        if (!isSubjectEdited) setEmailSubject(buildSubject(c.company_name));
                      }}
                      className="input-field"
                      disabled={false}
                    >
                      <option value="">— 顧客を選択してください —</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.company_name}（{c.email}）
                        </option>
                      ))}
                    </select>
                    {selectedCustomer && (
                      <p className="text-xs text-blue-600 mt-1">
                        会社名・メールアドレスを自動入力しました。手動で変更できます。
                      </p>
                    )}
                  </div>
                )}

                {/* ① 送信元会社名 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    送信元会社名
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCompanyName(val);
                      setEmailError(null);
                      // 件名: 手動編集していない場合のみ自動更新
                      if (!isSubjectEdited) {
                        if (mailTemplate?.subject_template) {
                          setEmailSubject(mailTemplate.subject_template.replace(/\{companyName\}/g, val));
                        } else {
                          setEmailSubject(buildSubject(val));
                        }
                      }
                      // 本文: 手動編集していない場合のみ自動更新
                      if (!isBodyEdited && mailTemplate?.body_template) {
                        setEmailBody(mailTemplate.body_template.replace(/\{companyName\}/g, val));
                      }
                    }}
                    placeholder="株式会社〇〇"
                    className="input-field"
                    disabled={emailStatus === "sending"}
                  />
                </div>

                {/* ② 送信先メールアドレス */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    送信先メールアドレス
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => { setEmailTo(e.target.value); setEmailError(null); }}
                    placeholder="customer@example.com"
                    className="input-field"
                    disabled={emailStatus === "sending"}
                  />
                </div>

                {/* ③ 件名（自動生成・手動編集可） */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      件名
                      <span className="text-red-400 ml-0.5">*</span>
                    </label>
                    {isSubjectEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          const rebuilt = mailTemplate?.subject_template
                            ? mailTemplate.subject_template.replace(/\{companyName\}/g, companyName)
                            : buildSubject(companyName);
                          setEmailSubject(rebuilt);
                          setIsSubjectEdited(false);
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 transition"
                      >
                        自動生成に戻す
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      setIsSubjectEdited(true);
                      setEmailError(null);
                    }}
                    placeholder="件名を入力"
                    className="input-field"
                    disabled={emailStatus === "sending"}
                  />
                  {!isSubjectEdited && (
                    <p className="text-xs text-slate-400 mt-1">
                      送信元会社名を変更すると自動で更新されます
                    </p>
                  )}
                </div>

                {/* ④ 本文（テンプレートから自動反映・手動編集可） */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">
                      本文
                    </label>
                    {isBodyEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          if (mailTemplate?.body_template) {
                            setEmailBody(
                              mailTemplate.body_template.replace(/\{companyName\}/g, companyName)
                            );
                          }
                          setIsBodyEdited(false);
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 transition"
                      >
                        テンプレートに戻す
                      </button>
                    )}
                  </div>
                  <textarea
                    value={emailBody}
                    onChange={(e) => {
                      setEmailBody(e.target.value);
                      setIsBodyEdited(true);
                      setEmailError(null);
                    }}
                    rows={6}
                    placeholder="メール本文を入力してください"
                    className="input-field resize-y leading-relaxed"
                    disabled={emailStatus === "sending"}
                  />
                  {!isBodyEdited && (
                    <p className="text-xs text-slate-400 mt-1">
                      送信元会社名を変更すると自動で更新されます（設定画面でテンプレートを編集できます）
                    </p>
                  )}
                </div>

                {/* ⑤ 添付ファイル確認 */}
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3.5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700">添付ファイル</p>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {selected?.file.name.replace(/\.[^.]+$/, "") + ".pdf"}
                    </p>
                  </div>
                </div>

                {/* メール送信エラー（フォーム内） */}
                {emailError && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-xs text-red-600">
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-red-400" />
                    {emailError}
                  </div>
                )}

                {/* ⑤ 送信ボタン */}
                <div className="flex justify-between items-center pt-1">
                  <button onClick={resetAll} className="btn-secondary text-sm">
                    <RefreshCw size={14} />
                    最初からやり直す
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={emailStatus === "sending"}
                    className="btn-primary"
                  >
                    {emailStatus === "sending" ? (
                      <><Loader2 size={15} className="animate-spin" />送信中...</>
                    ) : (
                      <><Send size={15} />メールを送信</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── メール送信中 ─── */}
          {emailStatus === "sending" && (
            <div className="card p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <Loader2 size={26} className="text-blue-500 animate-spin" />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mb-1">送信中...</h2>
              <p className="text-sm text-slate-500">PDFをメールに添付して送信しています。</p>
            </div>
          )}

          {/* ─── メール送信エラー ─── */}
          {emailStatus === "error" && emailError && (
            <ErrorCard
              title="メール送信に失敗しました"
              message={emailError}
              onRetry={handleSendEmail}
              onReset={resetAll}
            />
          )}

          {/* ─── 全ステップ完了 ─── */}
          {emailStatus === "success" && sentTo && (
            <div className="card p-8 flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center">
                  <Mail size={14} className="text-blue-500" />
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-1">
                送信完了！
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                PDFを添付してメールを送信しました。
              </p>

              {/* 送信サマリー */}
              <div className="w-full space-y-2 mb-6 text-left">
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">送信元会社名</p>
                  <p className="text-sm font-medium text-slate-800">{sentCompany}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">送信先</p>
                  <p className="text-sm font-medium text-slate-800">{sentTo}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">件名</p>
                  <p className="text-sm font-medium text-slate-800">{emailSubject}</p>
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">添付PDF（保存先）</p>
                  <p className="text-xs font-mono text-slate-600 break-all">{pdfPath}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={resetAll} className="btn-secondary">
                  <RefreshCw size={15} />
                  続けて別のファイルを送る
                </button>
                <button onClick={() => router.push("/dashboard")} className="btn-primary">
                  ダッシュボードへ
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
