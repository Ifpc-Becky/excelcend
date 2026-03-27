"use client";

import { useState, useCallback, useRef } from "react";
import {
  Plus,
  Mail,
  User,
  Building2,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  Upload,
  FileText,
  X,
} from "lucide-react";

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
export interface Customer {
  id: string;
  company_name: string;
  email: string;
  contact_name: string | null;
  notes: string | null;
  created_at: string;
}

// -------------------------------------------------------
// ユーティリティ
// -------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

// -------------------------------------------------------
// 空状態
// -------------------------------------------------------
function EmptyState({ onShowForm }: { onShowForm: () => void }) {
  return (
    <div className="card p-14 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
        <Users size={28} className="text-slate-400" />
      </div>
      <h3 className="font-display text-base font-bold text-slate-700 mb-2">
        まだ顧客は登録されていません
      </h3>
      <p className="text-sm text-slate-400 mb-7 leading-relaxed">
        送信時に顧客を追加すると、ここに表示されます。<br />
        下のフォームから手動で登録することもできます。
      </p>
      <button onClick={onShowForm} className="btn-primary">
        <Plus size={15} />
        顧客を追加する
      </button>
    </div>
  );
}

// -------------------------------------------------------
// メインコンポーネント
// -------------------------------------------------------
export default function CustomersClient({
  initialCustomers,
}: {
  initialCustomers: Customer[];
}) {
  const [customers,  setCustomers]  = useState<Customer[]>(initialCustomers);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState<Record<string, boolean>>({});
  const [formError,  setFormError]  = useState<string | null>(null);
  const [formSuccess,setFormSuccess]= useState(false);

  // フォーム state
  const [fCompany,  setFCompany]  = useState("");
  const [fEmail,    setFEmail]    = useState("");
  const [fContact,  setFContact]  = useState("");
  const [fNotes,    setFNotes]    = useState("");

  // CSV インポート state
  const csvInputRef                         = useRef<HTMLInputElement>(null);
  const [showCsvPanel,  setShowCsvPanel]   = useState(false);
  const [csvFile,       setCsvFile]        = useState<File | null>(null);
  const [csvImporting,  setCsvImporting]   = useState(false);
  const [csvResult,     setCsvResult]      = useState<{
    insertedCount: number;
    skippedCount:  number;
    parseErrors:   string[];
    message:       string;
  } | null>(null);
  const [csvError,      setCsvError]       = useState<string | null>(null);

  const resetForm = () => {
    setFCompany(""); setFEmail(""); setFContact(""); setFNotes("");
    setFormError(null); setFormSuccess(false);
  };

  // -------------------------------------------------------
  // 顧客追加
  // -------------------------------------------------------
  const handleAdd = useCallback(async () => {
    setFormError(null);
    setFormSuccess(false);

    if (!fCompany.trim()) { setFormError("会社名を入力してください"); return; }
    if (!fEmail.trim())   { setFormError("メールアドレスを入力してください"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName:  fCompany.trim(),
          email:        fEmail.trim(),
          contactName:  fContact.trim(),
          notes:        fNotes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "顧客の追加に失敗しました");

      // 先頭に追加（DBから再取得せずUIを即更新）
      setCustomers((prev) => [data.customer, ...prev]);
      setFormSuccess(true);
      resetForm();
      // 3秒後に成功メッセージ消去
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "顧客の追加に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }, [fCompany, fEmail, fContact, fNotes]);

  // -------------------------------------------------------
  // 顧客削除
  // -------------------------------------------------------
  const handleDelete = useCallback(async (id: string, companyName: string) => {
    if (!window.confirm(`「${companyName}」を削除しますか？`)) return;
    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "削除に失敗しました");
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeleting((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  }, []);

  // -------------------------------------------------------
  // 顧客一覧を再取得
  // -------------------------------------------------------
  const refreshCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data: Customer[] = await res.json();
        setCustomers(data);
      }
    } catch {
      // サイレント失敗
    }
  }, []);

  // -------------------------------------------------------
  // CSV インポート処理
  // -------------------------------------------------------
  const handleCsvImport = useCallback(async () => {
    if (!csvFile) return;

    setCsvImporting(true);
    setCsvError(null);
    setCsvResult(null);

    try {
      // FileReader でテキスト読み込み
      const csvText = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = (e) => resolve((e.target?.result as string) ?? "");
        reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
        reader.readAsText(csvFile, "UTF-8");
      });

      const res = await fetch("/api/customers/import", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ csv: csvText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "インポートに失敗しました");

      setCsvResult(data);
      setCsvFile(null);
      if (csvInputRef.current) csvInputRef.current.value = "";

      // 登録件数 > 0 なら一覧を再取得
      if (data.insertedCount > 0) {
        await refreshCustomers();
      }
    } catch (err) {
      setCsvError(err instanceof Error ? err.message : "インポートに失敗しました");
    } finally {
      setCsvImporting(false);
    }
  }, [csvFile, refreshCustomers]);

  // -------------------------------------------------------
  // レンダリング
  // -------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ページヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">顧客管理</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            登録顧客の一覧・管理　（全 {customers.length} 件）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowCsvPanel((v) => !v);
              setCsvResult(null);
              setCsvError(null);
              setCsvFile(null);
            }}
            className="btn-secondary"
          >
            <Upload size={15} />
            CSVインポート
          </button>
          <button
            onClick={() => { setShowForm((v) => !v); resetForm(); }}
            className="btn-primary"
          >
            {showForm ? <ChevronUp size={16} /> : <Plus size={16} />}
            {showForm ? "閉じる" : "顧客を追加"}
          </button>
        </div>
      </div>

      {/* ===== 追加フォーム ===== */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <Building2 size={16} className="text-blue-500" />
            新しい顧客を登録
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 会社名 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                会社名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fCompany}
                onChange={(e) => { setFCompany(e.target.value); setFormError(null); }}
                placeholder="株式会社〇〇"
                className="input-field"
                disabled={submitting}
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                メールアドレス <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={fEmail}
                onChange={(e) => { setFEmail(e.target.value); setFormError(null); }}
                placeholder="contact@example.com"
                className="input-field"
                disabled={submitting}
              />
            </div>

            {/* 担当者名 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                担当者名 <span className="text-slate-400 font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={fContact}
                onChange={(e) => setFContact(e.target.value)}
                placeholder="山田 太郎"
                className="input-field"
                disabled={submitting}
              />
            </div>

            {/* 備考 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                備考 <span className="text-slate-400 font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={fNotes}
                onChange={(e) => setFNotes(e.target.value)}
                placeholder="メモなど"
                className="input-field"
                disabled={submitting}
              />
            </div>
          </div>

          {/* フォームエラー */}
          {formError && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
              <AlertCircle size={13} className="flex-shrink-0 text-red-400" />
              {formError}
            </div>
          )}

          {/* 成功メッセージ */}
          {formSuccess && (
            <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700">
              <CheckCircle2 size={13} className="flex-shrink-0 text-emerald-500" />
              顧客を追加しました
            </div>
          )}

          <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting
                ? <><Loader2 size={14} className="animate-spin" />追加中...</>
                : <><Plus size={14} />顧客を追加</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ===== CSVインポートパネル ===== */}
      {showCsvPanel && (
        <div className="card p-6">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload size={16} className="text-blue-500" />
              CSVインポート
            </h2>
            <button
              onClick={() => { setShowCsvPanel(false); setCsvResult(null); setCsvError(null); setCsvFile(null); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
            >
              <X size={15} />
            </button>
          </div>

          {/* 説明 */}
          <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 mb-5">
            <p className="text-xs font-semibold text-blue-700 mb-2">
              📋 対応CSV形式
            </p>
            <p className="text-xs text-blue-600 mb-2">
              以下のヘッダーを含むCSVファイルをアップロードしてください（UTF-8）
            </p>
            <code className="block text-xs bg-white border border-blue-100 rounded-lg px-3 py-2 text-slate-700 font-mono">
              company_name,email,contact_name,notes
            </code>
            <ul className="text-xs text-blue-600 mt-2 space-y-0.5 list-disc list-inside">
              <li>company_name・email は必須</li>
              <li>contact_name・notes は任意（省略可）</li>
              <li>既に登録済みの顧客（同じ会社名＋メール）はスキップされます</li>
            </ul>
          </div>

          {/* サンプルCSVダウンロード */}
          <div className="mb-5">
            <button
              onClick={() => {
                const sample = "company_name,email,contact_name,notes\n株式会社サンプル,sample@example.com,山田太郎,メモ欄\n";
                const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "customers_sample.csv"; a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
            >
              <FileText size={13} />
              サンプルCSVをダウンロード
            </button>
          </div>

          {/* ファイル選択 */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              CSVファイルを選択
            </label>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => csvInputRef.current?.click()}
            >
              <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition ${
                csvFile
                  ? "border-blue-300 bg-blue-50/50"
                  : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/30"
              }`}>
                {csvFile ? (
                  <>
                    <FileText size={16} className="text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{csvFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCsvFile(null);
                        setCsvResult(null);
                        setCsvError(null);
                        if (csvInputRef.current) csvInputRef.current.value = "";
                      }}
                      className="ml-auto w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-400">
                      クリックしてCSVファイルを選択
                    </span>
                  </>
                )}
              </div>
            </div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setCsvFile(file);
                setCsvResult(null);
                setCsvError(null);
              }}
            />
          </div>

          {/* インポート結果 */}
          {csvResult && (
            <div className={`rounded-xl border px-4 py-3 mb-4 ${
              csvResult.insertedCount > 0
                ? "bg-emerald-50 border-emerald-100"
                : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={15} className={`flex-shrink-0 mt-0.5 ${
                  csvResult.insertedCount > 0 ? "text-emerald-500" : "text-slate-400"
                }`} />
                <div className="space-y-1">
                  {csvResult.insertedCount > 0 && (
                    <p className="text-xs font-semibold text-emerald-700">
                      {csvResult.insertedCount} 件を登録しました
                    </p>
                  )}
                  {csvResult.skippedCount > 0 && (
                    <p className="text-xs text-slate-600">
                      {csvResult.skippedCount} 件は重複のためスキップしました
                    </p>
                  )}
                  {csvResult.parseErrors.length > 0 && (
                    <details className="mt-1">
                      <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                        スキップ詳細 ({csvResult.parseErrors.length} 件)
                      </summary>
                      <ul className="mt-1 space-y-0.5">
                        {csvResult.parseErrors.map((e, i) => (
                          <li key={i} className="text-xs text-slate-500 pl-2">・{e}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* エラー */}
          {csvError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 mb-4 text-xs text-red-600">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-400" />
              {csvError}
            </div>
          )}

          {/* 実行ボタン */}
          <div className="flex justify-end pt-1 border-t border-slate-100">
            <button
              onClick={handleCsvImport}
              disabled={!csvFile || csvImporting}
              className="btn-primary"
            >
              {csvImporting ? (
                <><Loader2 size={14} className="animate-spin" />インポート中...</>
              ) : (
                <><Upload size={14} />インポート実行</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== 顧客一覧 ===== */}
      {customers.length === 0 ? (
        <EmptyState onShowForm={() => setShowForm(true)} />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 px-5 py-3">
                  会社名 / 担当者
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden sm:table-cell">
                  メールアドレス
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden lg:table-cell">
                  備考
                </th>
                <th className="text-left text-xs font-semibold text-slate-500 px-4 py-3 hidden md:table-cell">
                  登録日
                </th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* 会社名 / 担当者 */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {c.company_name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {c.company_name}
                        </p>
                        {c.contact_name && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <User size={10} />
                            {c.contact_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* メール */}
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Mail size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{c.email}</span>
                    </div>
                  </td>

                  {/* 備考 */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-sm text-slate-500 truncate max-w-[160px] block">
                      {c.notes || "—"}
                    </span>
                  </td>

                  {/* 登録日 */}
                  <td className="px-4 py-4 hidden md:table-cell whitespace-nowrap">
                    <span className="text-sm text-slate-500">
                      {formatDate(c.created_at)}
                    </span>
                  </td>

                  {/* 削除 */}
                  <td className="px-3 py-4">
                    <button
                      onClick={() => handleDelete(c.id, c.company_name)}
                      disabled={!!deleting[c.id]}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                      title="削除"
                    >
                      {deleting[c.id]
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Trash2 size={14} />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">全 {customers.length} 件</span>
          </div>
        </div>
      )}
    </div>
  );
}
