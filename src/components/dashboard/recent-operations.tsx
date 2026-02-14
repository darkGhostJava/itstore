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
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export function RecentOperations() {
  const [operations, setOperations] = React.useState<Operation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { t } = useTranslation('common');

  React.useEffect(() => {
    const getRecentOperations = async () => {
      try {
        setLoading(true);
        const result = await fetchOperations({ pageIndex: 0, pageSize: 6 });
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
    <Card className="glass-card border-none bg-card/40 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{t('recent_operations')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pr-2">
        <div className="space-y-6">
          {operations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t('no_recent_operations')}</p>
          ) : (
            operations.map((op, i) => {
              const user = op.user;
              const userAvatar = userAvatars.find(p => p.id === `user-${user?.id}`);
              const userName = user?.name || "Unknown User";
              const userInitial = userName.charAt(0).toUpperCase();
              
              return (
                <motion.div 
                  key={op.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 group"
                >
                  <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:scale-110 transition-transform">
                    {userAvatar && (
                        <AvatarImage 
                          src={userAvatar.imageUrl} 
                          alt="User avatar" 
                          data-ai-hint={userAvatar.imageHint}
                        />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1 min-w-0 flex-1">
                    <div className="text-sm font-medium leading-none flex items-center gap-2">
                      <Badge 
                        className="text-[10px] px-1.5 h-4"
                        variant={
                          op.type === "ARRIVAL" ? "default" :
                          op.type === "DISTRIBUTION" ? "secondary" :
                          op.type === "REPAIR" ? "destructive" :
                          "outline"
                        }
                      >
                        {op.type}
                      </Badge>
                      <span className="text-muted-foreground truncate text-xs">{op.remarks || t('no_remarks')}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t('by_user', { user: userName })}</p>
                  </div>
                  <div className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap">
                    {formatDistanceToNow(new Date(op.date), { addSuffix: true })}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentOperationsSkeleton() {
    const { t } = useTranslation('common');
    return (
        <Card className="glass-card border-none bg-card/40 h-full">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('recent_operations')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="grid gap-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="ml-auto h-3 w-12" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}