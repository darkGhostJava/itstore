"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticleDetailPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to stock since article detail view is retired
    router.replace("/stock");
  }, [router]);

  return null;
}
