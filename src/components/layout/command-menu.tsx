"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  ArrowRightLeft,
  Wrench,
  Users,
  Building,
  History,
  HardDrive,
  Boxes,
  Printer,
  Undo2,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { searchItems, fetchPersons, fetchAllStructures } from "@/lib/data";
import { Item, Person, Structure } from "@/lib/definitions";
import { useDebounce } from "@/hooks/use-debounce";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation('common');
  const router = useRouter();

  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);

  const [items, setItems] = React.useState<Item[]>([]);
  const [persons, setPersons] = React.useState<Person[]>([]);
  const [structures, setStructures] = React.useState<Structure[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setItems([]);
      setPersons([]);
      setStructures([]);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const [itemsRes, personsRes, allStructures] = await Promise.all([
          searchItems(debouncedQuery),
          fetchPersons({ pageIndex: 0, pageSize: 5, query: debouncedQuery }),
          fetchAllStructures(),
        ]);

        setItems(itemsRes || []);
        setPersons(personsRes.data || []);
        setStructures(
          allStructures.filter((s) =>
            s.name.toLowerCase().includes(debouncedQuery.toLowerCase())
          ).slice(0, 5)
        );
      } catch (error) {
        console.error("Global search failed", error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder={t('command_menu_placeholder', 'Type a command or search...')} 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? t('searching', 'Searching...') : t('no_results', 'No results found.')}
        </CommandEmpty>
        
        {/* Dynamic Search Results */}
        {items.length > 0 && (
          <CommandGroup heading={t('hardware')}>
            {items.map((item) => (
              <CommandItem
                key={`cmd-item-${item.id}`}
                onSelect={() => runCommand(() => router.push(`/items/${item.id}`))}
              >
                <HardDrive className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{item.serialNumber}</span>
                  <span className="text-[10px] text-muted-foreground">{item.article.model}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {persons.length > 0 && (
          <CommandGroup heading={t('persons')}>
            {persons.map((person) => (
              <CommandItem
                key={`cmd-person-${person.id}`}
                onSelect={() => runCommand(() => router.push(`/persons/${person.id}`))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>{person.firstName} {person.lastName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {structures.length > 0 && (
          <CommandGroup heading={t('structures')}>
            {structures.map((structure) => (
              <CommandItem
                key={`cmd-structure-${structure.id}`}
                onSelect={() => runCommand(() => router.push(`/structures/${structure.id}`))}
              >
                <Building className="mr-2 h-4 w-4" />
                <span>{structure.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick Navigation */}
        <CommandGroup heading={t('quick_navigation', 'Quick Navigation')}>
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>{t('dashboard')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/stock"))}>
            <Boxes className="mr-2 h-4 w-4" />
            <span>{t('stock')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/hardware"))}>
            <HardDrive className="mr-2 h-4 w-4" />
            <span>{t('hardware')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/consumables"))}>
            <Printer className="mr-2 h-4 w-4" />
            <span>{t('consumable')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/arrivals"))}>
            <Truck className="mr-2 h-4 w-4" />
            <span>{t('arrivals')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/distributions"))}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            <span>{t('distributions')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reparations"))}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>{t('reparations')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reversals"))}>
            <Undo2 className="mr-2 h-4 w-4" />
            <span>{t('reversements')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/operations"))}>
            <History className="mr-2 h-4 w-4" />
            <span>{t('operations')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
