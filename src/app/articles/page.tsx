"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticlesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect Article List requests to Stock
    router.replace("/stock");
  }, [router]);

  return null;
}
