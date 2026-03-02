"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Newspaper,
  FileText,
  BookOpen,
  Users,
  Building2,
  FolderOpen,
  Share2,
  Settings,
  LogOut,
  FlaskConical,
  BookMarked,
  Film,
  Handshake,
  ScrollText,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
  {
    label: "Дашборд",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Новости",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    label: "База знаний",
    href: "/admin/knowledge",
    icon: BookOpen,
  },
  {
    label: "Проекты",
    href: "/admin/projects",
    icon: FlaskConical,
  },
  {
    label: "Сотрудники",
    href: "/admin/team",
    icon: Users,
  },
  {
    label: "Подразделения",
    href: "/admin/departments",
    icon: Building2,
  },
  {
    label: "Публикации",
    href: "/admin/publications",
    icon: BookMarked,
  },
  {
    label: "Медиа",
    href: "/admin/media",
    icon: Film,
  },
  {
    label: "Партнёры",
    href: "/admin/partners",
    icon: Handshake,
  },
  {
    label: "Документы",
    href: "/admin/documents",
    icon: ScrollText,
  },
  {
    label: "Закупки",
    href: "/admin/procurements",
    icon: ShoppingCart,
  },
  {
    label: "Файлы",
    href: "/admin/files",
    icon: FolderOpen,
  },
  {
    label: "Кросс-постинг",
    href: "/admin/crosspost",
    icon: Share2,
  },
  {
    label: "Настройки",
    href: "/admin/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminSidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const initials = (user.name ?? "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel: Record<string, string> = {
    admin: "Администратор",
    editor: "Редактор",
    author: "Автор",
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
        {/* Логотип */}
        <div className="flex h-14 items-center border-b border-gray-200 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-xs font-bold text-white">АН</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-gray-900">ГБУ АНИЦ</p>
              <p className="text-[10px] text-gray-500">Управление контентом</p>
            </div>
          </Link>
        </div>

        {/* Навигация */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <li key={item.href}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-blue-600" : "text-gray-400"
                          )}
                        />
                        <span>{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="hidden">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Пользователь */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user.name ?? "Пользователь"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {roleLabel[user.role ?? ""] ?? user.role}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-gray-400 hover:text-red-600"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              title="Выйти"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
