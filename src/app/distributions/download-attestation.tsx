"use client";

import { useState } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Distribution } from "@/lib/definitions";
import { Download } from "lucide-react";

interface DownloadAttestationProps {
  distribution: Distribution;
}

export function DownloadAttestation({ distribution }: DownloadAttestationProps) {
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
      if (error.response && error.response.status === 404) {
        toast({
          variant: "destructive",
          title: "Attestation Not Found",
          description: "The attestation for this distribution has not been uploaded yet.",
        });
      } else {
        console.error("Download failed:", error);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "There was a problem downloading the attestation file.",
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
        {isDownloading ? "Downloading..." : "Download Attestation"}
      </div>
    </DropdownMenuItem>
  );
}
