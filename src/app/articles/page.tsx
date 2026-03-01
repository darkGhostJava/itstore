"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticlesPage() {
  const router = useRouter();

  useEffect(() => {
    // Definitive removal: redirect all Article List requests to Stock
    router.replace("/stock");
  }, [router]);

  return null;
}
