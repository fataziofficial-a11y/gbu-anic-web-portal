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
      <div className="flex min-h-85 flex-col items-center justify-center rounded-2xl border border-[#DDE8F0] bg-white p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
          <CheckCircle className="h-7 w-7 text-green-500" />
        </div>
        <h3 className="mb-2 text-lg font-black text-[#0D1C2E]">Сообщение отправлено!</h3>
        <p className="max-w-xs text-sm text-[#4B6075]">
          Мы получили ваше обращение и ответим в течение 1–2 рабочих дней.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 cursor-pointer text-sm text-arctic-cyan-500 underline underline-offset-2 transition-colors hover:text-[#1A3A6B]"
        >
          Отправить ещё одно сообщение
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-[#DDE8F0] bg-[#F7FAFD] px-4 py-2.5 text-sm text-[#0D1C2E] placeholder-[#8B9BAD] transition-all focus:border-[#5CAFD6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5CAFD6]/20";

  const labelClass = "text-[10px] font-bold uppercase tracking-widest text-[#8B9BAD]";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#DDE8F0] bg-white p-7 space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>
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
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
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
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className={labelClass}>
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
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className={labelClass}>
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
          className={`${inputClass} resize-none`}
        />
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1A3A6B] py-3 text-sm font-black uppercase tracking-wider text-white transition-colors hover:bg-arctic-deep-900 disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="text-center text-[10px] uppercase tracking-wider text-[#8B9BAD]">
        Мы ответим в течение 1–2 рабочих дней
      </p>
    </form>
  );
}
