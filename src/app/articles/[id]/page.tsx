"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticleDetailPage() {
  const router = useRouter();

  useEffect(() => {
    // Definitive removal: redirect all Article Detail requests to Stock
    router.replace("/stock");
  }, [router]);

  return null;
}
