
"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Distribution } from "@/lib/definitions";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadAttestationProps {
  distribution: Distribution;
}

export function DownloadAttestation({ distribution }: DownloadAttestationProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(
        `/distributions/${distribution.id}/attestation`,
        {
          responseType: "blob",
        }
      );

      const contentDisposition = response.headers["content-disposition"];
      let filename = `attestation_${distribution.id}.pdf`; // Default filename

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      if (error.response && (error.response.status === 404 || error.response.status === 400)) {
        toast({
          variant: "destructive",
          title: t('attestation_not_found_toast_title'),
          description: t('attestation_not_found_toast_desc'),
        });
      } else {
        console.error("Download failed:", error);
        toast({
          variant: "destructive",
          title: t('download_failed_toast_title'),
          description: t('download_failed_toast_desc'),
        });
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => e.preventDefault()}
      disabled={isDownloading}
      asChild
    >
      <div onClick={handleDownload} className="flex items-center cursor-pointer">
        <Download className="mr-2 h-4 w-4" />
        {isDownloading ? t('downloading') : t('download_attestation')}
      </div>
    </DropdownMenuItem>
  );
}
