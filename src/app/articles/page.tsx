
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticlesPage() {
  const router = useRouter();

  useEffect(() => {
    // Since a master articles list is not required, redirect to the general stock view.
    router.replace("/stock");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 animate-spin border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
