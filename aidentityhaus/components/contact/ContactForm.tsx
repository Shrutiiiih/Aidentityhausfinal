"use client";
import { useState } from "react";
import { PHONE } from "@/lib/content";
import { SendIcon } from "@/components/ui/Icons";
import "./contact-form.css";

const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
const EMAIL = "hello@aidentityhaus.com";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Enquiry form. With NEXT_PUBLIC_WEB3FORMS_KEY set, submissions are emailed to you (web3forms.com).
 * Without the key it falls back to opening the visitor's email app, pre-filled.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    if (d.get("botcheck")) return; // honeypot: bots fill this, people never see it
    const name = String(d.get("name") || "").trim();
    const email = String(d.get("email") || "").trim();
    const phone = String(d.get("phone") || "").trim();
    const message = String(d.get("message") || "").trim();

    if (!ACCESS_KEY) {
      const body = `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\n${message}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`New enquiry from ${name}`)}&body=${encodeURIComponent(body)}`;
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `New enquiry from ${name} — AIdentityHaus`,
          from_name: "AIdentityHaus website",
          name,
          email,
          phone: phone || "Not provided",
          message,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form className="cform" onSubmit={onSubmit} aria-labelledby="cform-title">
      <h3 id="cform-title" className="cform__title">Tell us what you need</h3>
      <p className="cform__sub">Takes less than a minute.</p>

      <label className="cform__field">
        <span>Your name</span>
        <input name="name" type="text" required autoComplete="name" placeholder="Your name" />
      </label>
      <label className="cform__field">
        <span>Email</span>
        <input name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
      </label>
      <label className="cform__field">
        <span>Phone / WhatsApp <em>(optional)</em></span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+91 …" />
      </label>
      <label className="cform__field">
        <span>What do you need?</span>
        <textarea name="message" required rows={4} placeholder="Tell us about your brand, project or idea…" />
      </label>

      <div className="cform__trap" aria-hidden="true">
        <input name="botcheck" type="checkbox" tabIndex={-1} autoComplete="off" />
      </div>

      <button className="cform__submit" type="submit" disabled={status === "sending"}>
        <SendIcon size={18} /> {status === "sending" ? "Sending…" : "Send message"}
      </button>

      <p className="cform__status" role="status" aria-live="polite">
        {status === "sent" && "Thank you! We've received your message and will get back to you shortly."}
        {status === "error" && (
          <>Something went wrong. Please call {PHONE.display} or email {EMAIL}.</>
        )}
      </p>
    </form>
  );
}
