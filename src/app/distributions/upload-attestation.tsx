
"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Distribution } from "@/lib/definitions";
import { Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UploadAttestationProps {
  distribution: Distribution;
}

export function UploadAttestation({ distribution }: UploadAttestationProps) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/distributions/${distribution.id}/attestation`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast({
        title: t('upload_successful_toast_title'),
        description: t('upload_successful_toast_desc', { id: distribution.id }),
      });
    } catch (error) {
      console.error("File upload failed:", error);
      toast({
        variant: "destructive",
        title: t('upload_failed_toast_title'),
        description: t('upload_failed_toast_desc'),
      });
    } finally {
      setIsUploading(false);
      // Reset file input value
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleMenuItemClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,image/*"
        disabled={isUploading}
      />
      <DropdownMenuItem
        onSelect={(e) => e.preventDefault()}
        disabled={isUploading}
        asChild
      >
        <div onClick={handleMenuItemClick} className="flex items-center cursor-pointer">
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? t('uploading') : t('upload_attestation')}
        </div>
      </DropdownMenuItem>
    </>
  );
}
