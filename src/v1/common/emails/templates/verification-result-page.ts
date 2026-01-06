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
  const icon = options.success
    ? `<svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4"></path><circle cx="12" cy="12" r="9"></circle></svg>`
    : `<svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${options.title}</title>
    <style>
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #eef2ff, #fef9c3);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        color: #111827;
      }
      .card {
        width: min(520px, 100%);
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24px;
        padding: 48px 40px;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
        text-align: center;
        backdrop-filter: blur(12px);
      }
      .icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 28px;
        color: ${accent};
      }
      p {
        margin: 0 0 32px;
        font-size: 16px;
        color: #4b5563;
      }
      a.button {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 14px 32px;
        border-radius: 999px;
        background: #2563eb;
        color: #fff;
        text-decoration: none;
        font-size: 16px;
        font-weight: 600;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      a.button:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
      }
      a.button span {
        font-size: 18px;
      }
    </style>
  </head>
  <body>
    <main class="card" role="status">
      <div class="icon" aria-hidden="true">${icon}</div>
      <h1>${options.title}</h1>
      <p>${options.message}</p>
      <a class="button" href="${options.continueUrl}" rel="noopener" target="_self">
        Continue
        <span>→</span>
      </a>
    </main>
  </body>
</html>`;
}
