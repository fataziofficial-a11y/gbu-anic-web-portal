"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Globe, EyeOff, Trash2, Loader2 } from "lucide-react";

interface Props {
  id: number;
  status: string;
  userRole: string;
}

export function NewsStatusActions({ id, status, userRole }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  const canPublish = ["admin", "editor"].includes(userRole);
  const canDelete = ["admin", "editor"].includes(userRole);

  async function handlePublishToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/news/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("Ошибка");
      toast.success(
        status === "published" ? "Новость снята с публикации" : "Новость опубликована"
      );
      router.refresh();
    } catch {
      toast.error("Не удалось изменить статус");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/news/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Ошибка");
      toast.success("Новость удалена");
      router.refresh();
    } catch {
      toast.error("Не удалось удалить новость");
    } finally {
      setLoading(false);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canPublish && (
            <DropdownMenuItem onClick={handlePublishToggle}>
              {status === "published" ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Снять с публикации
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Опубликовать
                </>
              )}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить новость?</DialogTitle>
            <DialogDescription>
              Это действие нельзя отменить. Новость будет удалена безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
