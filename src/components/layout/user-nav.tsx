
"use client";

import {
  Avatar,
  AvatarFallback,
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useKeycloak } from "@react-keycloak/web";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export function UserNav() {
  const { keycloak } = useKeycloak();
  const { i18n, t } = useTranslation('common');

  const handleLogout = () => {
    keycloak?.logout({
      redirectUri: window.location.origin, // redirect back to your frontend
    });
  };
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{keycloak?.tokenParsed?.preferred_username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {keycloak?.tokenParsed?.name || keycloak?.tokenParsed?.preferred_username || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {keycloak?.tokenParsed?.email || "example@email"}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
           <DropdownMenuItem>
              <ThemeToggle />
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Globe className="mr-2 h-4 w-4" />
                    <span>{t('language')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => changeLanguage('en')}>English</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeLanguage('fr')}>Français</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
        </DropdownMenuGroup>


        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          {t('log_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    