"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message ?? "You're subscribed!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-stone-600">{message}</p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-sm flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        disabled={status === "loading"}
        className="flex-1 border border-stone-300 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-stone-400 focus:border-stone-900 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="border border-stone-900 px-6 py-2.5 text-sm tracking-widest uppercase transition hover:bg-stone-900 hover:text-white disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>

      {status === "error" && (
        <p className="w-full text-xs text-red-500">{message}</p>
      )}
    </form>
  );
}
