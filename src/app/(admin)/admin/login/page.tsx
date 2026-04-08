"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallbackUrl && rawCallbackUrl.startsWith("/admin")
      ? rawCallbackUrl
      : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    fetch("/api/auth/csrf", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Не удалось получить csrf token");
        const data = (await res.json()) as { csrfToken?: string };
        if (active) {
          setCsrfToken(data.csrfToken ?? "");
        }
      })
      .catch(() => {
        if (active) {
          setError("Не удалось подготовить форму входа. Обновите страницу.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    startTransition(async () => {
      if (!csrfToken) {
        setError("Форма входа ещё загружается. Попробуйте снова через секунду.");
        return;
      }

      const body = new URLSearchParams({
        email,
        password,
        csrfToken,
        callbackUrl,
        json: "true",
      });

      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        credentials: "same-origin",
        body,
      });

      const text = await response.text();
      try {
        if (text) JSON.parse(text);
      } catch {
        // ignore malformed body, ориентируемся на HTTP-статус
      }

      if (!response.ok) {
        setError("Неверный email или пароль");
        return;
      }

      // Session cookie уже установлена auth callback-ом.
      // Переходим только по внутреннему admin-маршруту и не доверяем внешнему url из ответа.
      window.location.assign(callbackUrl);
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 px-4">
        {/* Логотип */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <span className="text-xl font-bold text-white">АН</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">ГБУ АНИЦ</h1>
          <p className="text-sm text-gray-500">Система управления контентом</p>
        </div>

        {/* Форма входа */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Вход в систему
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Ваш логин"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ваш пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 transition hover:text-gray-600"
                    disabled={isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending || !csrfToken}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : !csrfToken ? (
                  "Подготовка..."
                ) : (
                  "Войти"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          Арктический научно-исследовательский центр
          <br />
          Республики Саха (Якутия)
        </p>
      </div>
    </div>
  );
}
