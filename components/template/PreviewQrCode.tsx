"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function PreviewQrCode({ path }: { path: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, {
      width: 176,
      margin: 1,
      color: { dark: "#2e1749", light: "#ffffff" },
    }).then(setImageUrl).catch(() => setImageUrl(null));
  }, [path]);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/45 p-4">
      {imageUrl ? <img src={imageUrl} alt="手机扫码预览二维码" className="h-28 w-28 rounded-lg bg-white p-1" /> : <div className="h-28 w-28 animate-pulse rounded-lg bg-white" />}
      <div>
        <p className="text-sm font-semibold text-foreground">手机扫码预览</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-foreground-soft">扫码后以手机端比例打开当前互动病例；手机上的选择仅用于本次预览，不会修改已保存的病例项目。</p>
      </div>
    </div>
  );
}
