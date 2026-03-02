"use client";

import { useState, useTransition } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Status = "idle" | "success" | "error";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      setStatus("idle");
      setErrorMsg("");

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error ?? "Неизвестная ошибка");
          return;
        }

        setStatus("success");
        setForm({ name: "", email: "", subject: "", message: "" });
      } catch {
        setStatus("error");
        setErrorMsg("Ошибка сети. Проверьте подключение и попробуйте снова.");
      }
    });
  }

  if (status === "success") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-10 flex flex-col items-center justify-center text-center shadow-sm min-h-[340px]">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="font-semibold text-arctic-900 text-lg mb-2">Сообщение отправлено!</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          Мы получили ваше обращение и ответим в течение 1–2 рабочих дней.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-glacial hover:text-glacial-dark underline underline-offset-2 transition-colors"
        >
          Отправить ещё одно сообщение
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200/80 p-7 space-y-5 shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
          >
            Имя <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Иван Иванов"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-glacial/30 focus:border-glacial transition-all bg-frost-50/50"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
          >
            Email <span className="text-red-400">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="ivanov@example.ru"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-glacial/30 focus:border-glacial transition-all bg-frost-50/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="subject"
          className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
        >
          Тема <span className="text-red-400">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          value={form.subject}
          onChange={handleChange}
          placeholder="Тема обращения"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-glacial/30 focus:border-glacial transition-all bg-frost-50/50"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="text-xs font-semibold text-slate-600 uppercase tracking-wider"
        >
          Сообщение <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={form.message}
          onChange={handleChange}
          placeholder="Ваше сообщение..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-glacial/30 focus:border-glacial transition-all resize-none bg-frost-50/50"
        />
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-glacial text-white py-3 rounded-xl font-semibold text-sm hover:bg-glacial-dark transition-colors flex items-center justify-center gap-2 shadow-sm shadow-glacial/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Отправляем...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Отправить сообщение
          </>
        )}
      </button>

      <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider">
        Мы ответим в течение 1–2 рабочих дней
      </p>
    </form>
  );
}
