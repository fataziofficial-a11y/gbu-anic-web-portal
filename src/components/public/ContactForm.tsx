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
      <div className="card-dark p-10 flex flex-col items-center justify-center text-center min-h-[340px]">
        <div className="w-14 h-14 bg-[#00E5C0]/10 border border-[#00E5C0]/20 flex items-center justify-center mb-4">
          <CheckCircle className="h-7 w-7 text-[#00E5C0]" />
        </div>
        <h3 className="font-black text-white text-lg mb-2 uppercase tracking-tight">Сообщение отправлено!</h3>
        <p className="text-white/35 text-sm max-w-xs">
          Мы получили ваше обращение и ответим в течение 1–2 рабочих дней.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-[#00E5C0]/60 hover:text-[#00E5C0] underline underline-offset-2 transition-colors"
        >
          Отправить ещё одно сообщение
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-dark p-7 space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-[10px] font-black text-white/30 uppercase tracking-widest"
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
            className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00E5C0]/50 focus:ring-0 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-[10px] font-black text-white/30 uppercase tracking-widest"
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
            className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00E5C0]/50 focus:ring-0 transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="subject"
          className="text-[10px] font-black text-white/30 uppercase tracking-widest"
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
          className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00E5C0]/50 focus:ring-0 transition-all"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="text-[10px] font-black text-white/30 uppercase tracking-widest"
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
          className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#00E5C0]/50 focus:ring-0 transition-all resize-none"
        />
      </div>

      {status === "error" && (
        <div className="flex items-start gap-2.5 bg-red-900/20 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#00E5C0] text-[#050E1C] py-3 font-black text-sm uppercase tracking-wider hover:bg-[#00E5C0]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

      <p className="text-[10px] text-white/15 text-center uppercase tracking-wider">
        Мы ответим в течение 1–2 рабочих дней
      </p>
    </form>
  );
}
