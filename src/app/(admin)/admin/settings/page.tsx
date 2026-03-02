"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Settings } from "lucide-react";

interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "url" | "email" | "tel";
}

const SETTING_GROUPS: { title: string; fields: SettingField[] }[] = [
  {
    title: "Информация о сайте",
    fields: [
      { key: "site_name", label: "Название сайта", placeholder: "ГБУ АНИЦ" },
      { key: "site_description", label: "Описание", type: "textarea", placeholder: "Краткое описание организации" },
    ],
  },
  {
    title: "Контактная информация",
    fields: [
      { key: "contact_email", label: "Email", type: "email", placeholder: "info@anic.ru" },
      { key: "contact_phone", label: "Телефон", type: "tel", placeholder: "+7 (4112) 00-00-00" },
      { key: "contact_address", label: "Адрес", type: "textarea", placeholder: "677000, РС(Я), г. Якутск..." },
    ],
  },
  {
    title: "Социальные сети",
    fields: [
      { key: "telegram_url", label: "Telegram", type: "url", placeholder: "https://t.me/..." },
      { key: "vk_url", label: "ВКонтакте", type: "url", placeholder: "https://vk.com/..." },
      { key: "ok_url", label: "Одноклассники", type: "url", placeholder: "https://ok.ru/..." },
      { key: "max_url", label: "MAX", type: "url", placeholder: "https://max.ru/..." },
    ],
  },
  {
    title: "SEO и техническое",
    fields: [
      { key: "robots_txt", label: "robots.txt", type: "textarea", placeholder: "User-agent: *\nDisallow:" },
    ],
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function load() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      setValues(json.data?.map ?? {});
    } catch {
      toast.error("Ошибка загрузки настроек");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
        toast.success("Настройки сохранены");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Ошибка");
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Settings className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
            <p className="text-sm text-gray-500">Конфигурация сайта</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Сохранить
        </Button>
      </div>

      {/* Группы настроек */}
      {SETTING_GROUPS.map((group) => (
        <section key={group.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">{group.title}</p>
          </div>
          <div className="p-5 space-y-4">
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key} className="text-sm">
                  {field.label}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.key}
                    value={values[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="font-mono text-sm"
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type ?? "text"}
                    value={values[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
                <p className="text-xs text-gray-400 font-mono">{field.key}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Кнопка снизу */}
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Сохранить все настройки
        </Button>
      </div>
    </div>
  );
}
