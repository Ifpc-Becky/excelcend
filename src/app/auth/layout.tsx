export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] bg-slate-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h8v2H2V3zm0 4h12v2H2V7zm0 4h6v2H2v-2z" fill="white"/>
              </svg>
            </div>
            <span className="font-display text-lg font-bold tracking-tight">ExcelCend</span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-snug mb-4">
            請求書送付を<br />もっとシンプルに。
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Excelファイルをアップロードするだけで、<br />
            PDF変換・メール送信まで自動で完結します。
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: "📄", text: "Excelを瞬時にPDF変換" },
            { icon: "📧", text: "顧客への一括メール送信" },
            { icon: "📊", text: "送信履歴の一元管理" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-base">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
          <p className="text-xs text-slate-500 pt-2">
            © 2025 ExcelCend. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M2 3h8v2H2V3zm0 4h12v2H2V7zm0 4h6v2H2v-2z" fill="white"/>
              </svg>
            </div>
            <span className="font-display text-base font-bold text-slate-900">ExcelCend</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
