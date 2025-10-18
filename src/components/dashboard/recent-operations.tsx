import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOperations, mockUsers } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { formatDistanceToNow } from "date-fns";

export function RecentOperations() {
  const recentOperations = mockOperations
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const userAvatars = PlaceHolderImages.filter(p => p.id.startsWith('user-'));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Operations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {recentOperations.map((op) => {
          const user = mockUsers.find((u) => u.id === op.userId);
          const userAvatar = userAvatars.find(p => p.id === `user-${user?.id}`);
          const userName = user?.name || "Unknown User";
          const userInitial = userName.charAt(0);
          
          return (
            <div key={op.id} className="flex items-center gap-4">
              <Avatar className="hidden h-9 w-9 sm:flex">
                {userAvatar && (
                    <AvatarImage 
                      src={userAvatar.imageUrl} 
                      alt="User avatar" 
                      width={40} 
                      height={40}
                      data-ai-hint={userAvatar.imageHint}
                    />
                )}
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">
                  {op.type}: {op.remarks || 'No remarks'}
                </p>
                <p className="text-sm text-muted-foreground">by {userName}</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(op.date), { addSuffix: true })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
