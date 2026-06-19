/**
 * Mailversand des Zugangscodes nach erfolgreicher Zahlung (Resend, via REST —
 * keine Extra-Dependency, im Stil des Stripe-Aufrufs in index.js).
 *
 * Inert ohne RESEND_API_KEY: sendCodeEmail() gibt dann { sent:false } zurück und
 * wirft NIE — der Webhook-/Kauf-Flow darf an einem Mailfehler nicht scheitern.
 *
 * Setup:  fly secrets set RESEND_API_KEY=re_... MAIL_FROM="Smart Meal <hi@deine-domain>"
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Absender muss bei Resend verifiziert sein. onboarding@resend.dev geht nur an
// die eigene Account-Adresse — für echten Versand eigene Domain hinterlegen.
const MAIL_FROM = process.env.MAIL_FROM || "Smart Meal <onboarding@resend.dev>";

export const mailEnabled = () => !!RESEND_API_KEY;

const _esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function _codeEmailHtml(code, expiresAt) {
  const valid = expiresAt
    ? new Date(expiresAt).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })
    : null;
  return `<!doctype html><html lang="de"><body style="margin:0;background:#FFF8F0;font-family:system-ui,-apple-system,sans-serif;color:#2a2a2a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="460" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08)">
<tr><td style="padding:28px 32px 8px">
<div style="font-size:30px">🍽️</div>
<h1 style="font-size:20px;margin:8px 0 4px;color:#C8611A">Dein Zugang zu Smart Meal</h1>
<p style="font-size:14px;color:#555;margin:0 0 18px">Danke für deinen Kauf! Mit diesem persönlichen Code schaltest du Smart Meal frei${valid ? ` — gültig bis <strong>${_esc(valid)}</strong>` : ""}:</p>
<div style="font-family:ui-monospace,Menlo,monospace;font-size:15px;letter-spacing:.5px;background:#0f172a;color:#a7f3d0;border-radius:10px;padding:14px 16px;word-break:break-all">${_esc(code)}</div>
<p style="font-size:13px;color:#777;margin:18px 0 0">Öffne Smart Meal, gib den Code im Zugang-Fenster ein und leg los. Bewahre diese E-Mail gut auf.</p>
</td></tr>
<tr><td style="padding:18px 32px 28px;color:#999;font-size:12px;border-top:1px solid #f0e6db">Smart Meal · Rawkeep · Bei Fragen einfach auf diese Mail antworten.</td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Schickt den Zugangscode an den Käufer. Schlägt nie hart fehl.
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
export async function sendCodeEmail({ to, code, expiresAt }) {
  if (!RESEND_API_KEY) return { sent: false, reason: "mail-disabled" };
  if (!to) return { sent: false, reason: "no-recipient" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: MAIL_FROM,
        to,
        subject: "Dein Smart-Meal Zugangscode",
        html: _codeEmailHtml(code, expiresAt),
      }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { sent: false, reason: `resend ${r.status}: ${body.slice(0, 200)}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err?.message || "fetch-failed" };
  }
}
