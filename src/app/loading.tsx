import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Skeleton for Collapsed Sidebar */}
      <div className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5 flex-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-col gap-4 items-center w-full">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
           <Skeleton className="h-10 w-10 rounded-lg" />
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col sm:ml-14">
        {/* Skeleton for Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="block">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="relative ml-auto flex-1 md:grow-0">
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>

        {/* Skeleton for Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                    <Skeleton className="h-24 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-[400px] w-full" />
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
