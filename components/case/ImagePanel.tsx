"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useCaseStore } from "@/lib/store/case-store";
import { EXAM_TYPE_OPTIONS, type ExamType } from "@/lib/types/case";

/** 必选项检查之后的独立小节——检查图片：仅作素材保留，检查类型/报告结果人工录入（ADR-0004） */
export function ImagePanel() {
  const { input, addImages, updateImageExamType, updateImageReportText, removeImage } =
    useCaseStore();

  const imageFileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {input.images.length > 0 && (
        <div className="mb-3 flex flex-col gap-3">
          {input.images.map((img) => (
            <div
              key={img.id}
              className="flex gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                <Image
                  src={img.previewUrl}
                  alt={img.fileName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] text-foreground-soft">
                    {img.fileName}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="rounded p-0.5 text-foreground-faint hover:text-foreground"
                    aria-label="移除图片"
                  >
                    <X size={13} />
                  </button>
                </div>
                <span className="text-[11px] text-foreground-faint">
                  检查类型（可选）
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EXAM_TYPE_OPTIONS.map((et) => (
                    <button
                      key={et}
                      type="button"
                      onClick={() => updateImageExamType(img.id, et as ExamType)}
                      className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                        img.examType === et
                          ? "border-transparent bg-brand-700 text-white"
                          : "border-border text-foreground-soft hover:bg-surface-sunken"
                      }`}
                    >
                      {et}
                    </button>
                  ))}
                </div>
                <textarea
                  value={img.reportText ?? ""}
                  onChange={(e) => updateImageReportText(img.id, e.target.value)}
                  rows={2}
                  placeholder="报告结果（可选，人工录入，不从图片中识别）"
                  className="w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-[12px] text-foreground outline-none placeholder:text-foreground-faint focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => imageFileRef.current?.click()}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground-soft transition-colors hover:bg-surface-sunken"
      >
        <ImagePlus size={14} />
        添加检查图片
      </button>
      <input
        ref={imageFileRef}
        type="file"
        multiple
        className="sr-only"
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) addImages(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
