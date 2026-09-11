"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CopySimpleIcon, DownloadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function QrCodePanel({
  qrCodeUrl,
  fileName,
  alt,
}: {
  qrCodeUrl: string;
  fileName: string;
  alt: string;
}) {
  const [copying, setCopying] = useState(false);

  async function handleCopy() {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      toast.error("Clipboard image copy isn't supported in this browser");
      return;
    }

    setCopying(true);

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || "image/png"]: blob }),
      ]);

      toast.success("QR code copied to clipboard");
    } catch {
      toast.error("Failed to copy QR code");
    } finally {
      setCopying(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 border border-border p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrCodeUrl} alt={alt} className="size-60 self-center border border-border" />

      <div className="flex w-full gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          nativeButton={false}
          render={<a href={qrCodeUrl} download={fileName} />}
        >
          <DownloadSimpleIcon className="size-4" />
          Download
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={copying}
          onClick={handleCopy}
        >
          <CopySimpleIcon className="size-4" />
          Copy
        </Button>
      </div>
    </div>
  );
}
