"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { ThemeToggle } from "./theme-toggle";
import { useKeycloak } from "@react-keycloak/web";

export function UserNav() {
  const { keycloak } = useKeycloak();

  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-1");

  const handleLogout = () => {
    keycloak.logout({
      redirectUri: window.location.origin, // redirect back to your frontend
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
         
            <AvatarFallback>User</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {keycloak.tokenParsed?.preferred_username || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {keycloak.tokenParsed?.email || "example@email"}
            </p>
          </div>
        </DropdownMenuLabel>


        <DropdownMenuItem>
          <ThemeToggle />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
