
"use client"

import * as React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOperations } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import type { Operation } from "@/lib/definitions";
import { Badge } from "../ui/badge";

export function RecentOperations() {
  const [operations, setOperations] = React.useState<Operation[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const getRecentOperations = async () => {
      try {
        setLoading(true);
        const result = await fetchOperations({ pageIndex: 0, pageSize: 5 });
        setOperations(result.data);
      } catch (error) {
        console.error("Failed to fetch recent operations:", error);
        setOperations([]);
      } finally {
        setLoading(false);
      }
    };
    getRecentOperations();
  }, []);
  
  const userAvatars = PlaceHolderImages.filter(p => p.id.startsWith('user-'));

  if (loading) {
    return <RecentOperationsSkeleton />;
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Operations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {operations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent operations found.</p>
        ) : (
          operations.map((op) => {
            const user = op.user;
            const userAvatar = userAvatars.find(p => p.id === `user-${user?.id}`);
            const userName = user?.name || "Unknown User";
            const userInitial = userName.charAt(0).toUpperCase();
            
            return (
              <div key={op.id} className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  {userAvatar && (
                      <AvatarImage 
                        src={userAvatar.imageUrl} 
                        alt="User avatar" 
                        data-ai-hint={userAvatar.imageHint}
                      />
                  )}
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <div className="text-sm font-medium leading-none flex items-center gap-2">
                    <Badge variant={
                      op.type === "ARRIVAL" ? "default" :
                      op.type === "DISTRIBUTION" ? "secondary" :
                      op.type === "REPARATION" ? "destructive" :
                      "outline"
                    }>{op.type}</Badge>
                    <span className="text-muted-foreground truncate max-w-[200px]">{op.remarks || 'No remarks'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">by {userName}</p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(op.date), { addSuffix: true })}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function RecentOperationsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Operations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="grid gap-1">
                           <Skeleton className="h-4 w-48" />
                           <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="ml-auto h-4 w-20" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
