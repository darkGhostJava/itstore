
"use client";

import React, { Fragment, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Skeleton } from "../ui/skeleton";
import { fetchItemById, fetchPersonById, fetchStructureById, fetchArticleById } from "@/lib/data";

interface Crumb {
  name: string;
  href: string;
  isLast: boolean;
}

const fetchNameForId = async (segment: string, id: string): Promise<string | null> => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return id;

  try {
    switch (segment) {
      case "items":
        const item = await fetchItemById(numericId);
        return item?.serialNumber || id;
      case "persons":
        const person = await fetchPersonById(numericId);
        return `${person?.firstName} ${person?.lastName}` || id;
      case "structures":
        const structure = await fetchStructureById(numericId);
        return structure?.name || id;
      case "articles":
        const article = await fetchArticleById(numericId);
        return article?.model || id;
      default:
        return id;
    }
  } catch (error) {
    console.error(`Failed to fetch name for ${segment}/${id}`, error);
    return id; // Fallback to id on error
  }
};


export function Breadcrumbs() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<Crumb[] | null>(null);

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const segments = pathname.split("/").filter(Boolean);
      const newBreadcrumbs: Crumb[] = [];

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const href = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;
        let name = segment.charAt(0).toUpperCase() + segment.slice(1);

        // Check if the next segment is a numeric ID
        const isIdSegment = !isNaN(parseInt(segment, 10));
        const prevSegment = i > 0 ? segments[i - 1] : null;

        if (isIdSegment && prevSegment) {
          name = (await fetchNameForId(prevSegment, segment)) || segment;
        }
        
        newBreadcrumbs.push({ name, href, isLast });
      }
      
      setBreadcrumbs(newBreadcrumbs);
    };

    generateBreadcrumbs();
  }, [pathname]);

  if (!breadcrumbs) {
    return (
       <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Skeleton className="h-5 w-20" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}
        {breadcrumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                 <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
