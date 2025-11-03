"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Distribution } from "@/lib/definitions";
import { Upload } from "lucide-react";

interface UploadAttestationProps {
  distribution: Distribution;
}

export function UploadAttestation({ distribution }: UploadAttestationProps) {
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
        title: "Upload Successful",
        description: `Attestation for distribution #${distribution.id} has been uploaded.`,
      });
    } catch (error) {
      console.error("File upload failed:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "There was a problem uploading the attestation file.",
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
      <DropdownMenuItem onSelect={handleMenuItemClick} disabled={isUploading}>
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload Attestation"}
      </DropdownMenuItem>
    </>
  );
}
