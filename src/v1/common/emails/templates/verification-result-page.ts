export type VerificationResultOptions = {
  title: string;
  message: string;
  success: boolean;
  continueUrl: string;
};

export function renderVerificationResultPage(
  options: VerificationResultOptions,
): string {
  const accent = options.success ? '#059669' : '#dc2626';
  const accentSoft = options.success ? '#bbf7d0' : '#fecaca';
  const icon = options.success
    ? `<svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="9"></circle></svg>`
    : `<svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${options.title} • PartsQuote</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: radial-gradient(circle at top, #e0f2fe, #dbeafe 35%, #f8fafc);
        color: #0f172a;
      }
      .grid {
        display: grid;
        place-items: center;
        min-height: 100vh;
        padding: 40px 20px;
      }
      .card {
        width: min(640px, 100%);
        background: rgba(255, 255, 255, 0.95);
        border-radius: 32px;
        padding: 56px 48px;
        box-shadow: 0 30px 80px rgba(15, 23, 42, 0.15);
        border: 1px solid rgba(148, 163, 184, 0.25);
        text-align: center;
        backdrop-filter: blur(20px);
        position: relative;
      }
      .card::after {
        content: '';
        position: absolute;
        inset: 12px;
        border-radius: 26px;
        border: 1px dashed rgba(148, 163, 184, 0.35);
        pointer-events: none;
      }
      .icon {
        width: 120px;
        height: 120px;
        border-radius: 32px;
        margin: 0 auto 24px;
        background: ${accentSoft};
        display: flex;
        align-items: center;
        justify-content: center;
      }
      h1 {
        margin: 0 0 16px;
        font-size: clamp(26px, 4vw, 34px);
        color: ${accent};
      }
      p {
        margin: 0 0 32px;
        font-size: 18px;
        line-height: 1.6;
        color: #475467;
      }
      .brand {
        margin-bottom: 32px;
        color: #0f172a;
        letter-spacing: 1px;
        font-weight: 600;
        text-transform: uppercase;
        opacity: 0.7;
      }
      .button {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 14px 38px;
        border-radius: 9999px;
        background: #0ea5e9;
        color: #fff;
        text-decoration: none;
        font-size: 17px;
        font-weight: 600;
        box-shadow: 0 15px 35px rgba(14, 165, 233, 0.45);
        transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      }
      .button:hover {
        background: #0284c7;
        transform: translateY(-2px);
        box-shadow: 0 20px 45px rgba(14, 165, 233, 0.45);
      }
      .button span {
        font-size: 22px;
      }
      .footer-note {
        margin-top: 24px;
        font-size: 14px;
        color: #94a3b8;
      }
      @media (max-width: 520px) {
        .card {
          padding: 40px 28px;
          border-radius: 24px;
        }
        .card::after {
          inset: 8px;
          border-radius: 18px;
        }
        .icon {
          width: 96px;
          height: 96px;
          border-radius: 28px;
        }
        p {
          font-size: 16px;
        }
      }
    </style>
  </head>
  <body>
    <div class="grid">
      <main class="card" role="status">
        <div class="brand">PartsQuote</div>
        <div class="icon" aria-hidden="true">${icon}</div>
        <h1>${options.title}</h1>
        <p>${options.message}</p>
        <a class="button" href="${options.continueUrl}" rel="noopener" target="_self">
          Return to PartsQuote
          <span>→</span>
        </a>
        <p class="footer-note">Need help? Reach us at support@partsquote.co.uk.</p>
      </main>
    </div>
  </body>
</html>`;
}
