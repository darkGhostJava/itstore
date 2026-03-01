"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticleDetailPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect Article Detail requests to Stock since specific model views are retired
    router.replace("/stock");
  }, [router]);

  return null;
}
