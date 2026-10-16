"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icon";

export type NavItem = { href: string; label: string; icon: string; badge?: number; exact?: boolean };

export function SidebarNav({ items, title }: { items: NavItem[]; title: string }) {
  const path = usePathname();
  return (
    <nav aria-label={title} className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      <p className="hidden px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 lg:block">{title}</p>
      {items.map((item) => {
        const active = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Icon name={item.icon} size={18} />
            <span className="whitespace-nowrap">{item.label}</span>
            {item.badge ? (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? "bg-white/25 text-white" : "bg-accent text-white"}`}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
