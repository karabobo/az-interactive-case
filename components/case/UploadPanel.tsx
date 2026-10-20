"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, FileUp, Loader2, X } from "lucide-react";
import { useCaseStore } from "@/lib/store/case-store";

/** 步骤①-2 上传资料：服务器端存储并解析 .docx / 可检索 PDF。 */
export function UploadPanel() {
  const { input, uploadCaseDocument, removeCaseDocument } = useCaseStore();

  const caseFileRef = useRef<HTMLInputElement>(null);
  const [showRawText, setShowRawText] = useState(false);

  const doc = input.caseDocument;
  const selectFile = (file?: File) => { if (file) void uploadCaseDocument(file); };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">上传病例文档</p>

      {!doc ? (
        <button
          type="button"
          onClick={() => caseFileRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files?.[0]); }}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-brand-200 bg-brand-50 px-4 py-4 text-left transition-colors hover:border-brand-400"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand-600">
            <FileUp size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">
              点击或拖拽病例文档到此处上传
            </span>
            <span className="block text-[11px] text-foreground-faint">
              支持 .docx / 可检索 PDF，最大 20 MB；文件按当前账号隔离存储
            </span>
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <FileUp size={15} />
              </span>
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {doc.fileName}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {doc.id && doc.id !== "uploading" && (
                <a
                  href={`/api/uploads/case/${doc.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  下载原文件
                </a>
              )}
              <button
                type="button"
                onClick={() => caseFileRef.current?.click()}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                替换
              </button>
              <button
                type="button"
                onClick={removeCaseDocument}
                className="rounded p-1 text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
                aria-label="移除病例文档"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="mt-2">
            {doc.parseStatus === "parsing" && (
              <p className="flex items-center gap-1.5 text-xs text-foreground-faint">
                <Loader2 size={12} className="animate-spin" />
                正在解析文档原文…
              </p>
            )}
            {doc.parseStatus === "parsed" && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowRawText((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:underline"
                >
                  <Check size={12} />
                  已上传并读取原文（{doc.rawText?.length ?? 0} 字）
                  <span className="text-foreground-faint">
                    {showRawText ? "· 收起预览" : "· 查看预览"}
                  </span>
                </button>
                {showRawText && (
                  <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-sunken p-3 text-[12px] leading-relaxed text-foreground-soft">
                    {doc.rawText}
                  </pre>
                )}
              </div>
            )}
            {doc.parseStatus === "error" && (
              <p className="flex items-center gap-1.5 text-xs text-wine-500">
                <AlertTriangle size={12} />
                {doc.parseError ?? "文档解析失败"}
              </p>
            )}
          </div>
        </div>
      )}

      <input
        ref={caseFileRef}
        type="file"
        className="sr-only"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          const f = e.target.files?.[0];
          selectFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
