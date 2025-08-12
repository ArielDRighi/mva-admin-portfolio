"use client";

import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { NavMainItem } from "@/types/types";
import Link from "next/link";

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm font-bold tracking-wider text-primary/80 mb-2">
        Gestión
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(item.url);
          const hasActiveChild = item.items?.some(
            (subItem) => pathname === subItem.url
          );

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive || hasActiveChild}
              className="group/collapsible mb-1"
            >
              <SidebarMenuItem>
                {" "}
                <CollapsibleTrigger asChild>
                  <div
                    className={cn(
                      "flex items-center w-full h-10 px-2 py-1.5 gap-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-muted/80 min-h-[32px]",
                      isActive && "bg-muted font-medium text-primary"
                    )}
                  >
                    <div className="flex items-center flex-1">
                      {item.icon && (
                        <div
                          className={cn(
                            "h-5 w-5 mr-2 transition-colors shrink-0",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          <item.icon className="h-full w-full" />
                        </div>
                      )}
                      <span className="whitespace-normal break-words">
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform duration-300 text-muted-foreground shrink-0",
                        "group-data-[state=open]/collapsible:rotate-90",
                        isActive && "text-primary"
                      )}
                    />
                  </div>
                </CollapsibleTrigger>{" "}
                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {" "}
                    <SidebarMenuSub className="pl-4 border-l-[1px] border-border/40 ml-4 mt-1 flex flex-col">
                      {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url;
                        return (
                          <SidebarMenuSubItem
                            key={subItem.title}
                            className="w-full flex-wrap"
                          >
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                "transition-all duration-150 hover:text-primary flex w-full h-auto",
                                isSubActive &&
                                  "font-medium text-primary bg-muted/50"
                              )}
                            >
                              <Link
                                href={subItem.url}
                                className="py-2 px-2 rounded flex items-center min-h-[36px] break-words w-full"
                              >
                                <span className="flex-1 whitespace-normal overflow-visible hyphens-auto">
                                  {subItem.title}
                                </span>
                                {isSubActive && (
                                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                )}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </motion.div>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
