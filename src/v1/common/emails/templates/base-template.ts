export type TemplateCta = {
  label: string;
  url: string;
};

export type HighlightItem = {
  label: string;
  value: string;
};

export type EmailTemplateOptions = {
  previewText?: string;
  heading: string;
  intro?: string;
  bodyLines?: string[];
  highlights?: HighlightItem[];
  cta?: TemplateCta;
  footerNote?: string;
};

const palette = {
  background: '#f4f6fb',
  card: '#ffffff',
  border: '#e5e7eb',
  accent: '#ef4444',
  text: '#0f172a',
  muted: '#6b7280',
  gradient: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
};

export function renderTemplate({
  previewText,
  heading,
  intro,
  bodyLines = [],
  highlights = [],
  cta,
  footerNote,
}: EmailTemplateOptions): string {
  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${previewText}</div>`
    : '';

  const bodyParagraphs = bodyLines
    .map(
      (line) =>
        `<p style="margin:0 0 16px;font-size:15px;color:${palette.text};line-height:1.5;">${line}</p>`,
    )
    .join('');

  const highlightTable = highlights.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
      ${highlights
        .map(
          (item) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;color:${palette.muted};">${item.label}</td>
          <td style="padding:8px 0;font-size:15px;font-weight:600;color:${palette.text};text-align:right;">${item.value}</td>
        </tr>`,
        )
        .join('')}
      </table>`
    : '';

  const ctaButton = cta
    ? `<a href="${cta.url}" style="display:inline-block;margin-top:12px;padding:12px 28px;border-radius:999px;background:${palette.gradient};color:#fff;text-decoration:none;font-weight:600;">${cta.label}</a>`
    : '';

  const footer = footerNote
    ? `<p style="margin:24px 0 0;font-size:13px;color:${palette.muted};line-height:1.4;">${footerNote}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:${palette.background};font-family:'Inter','Segoe UI',system-ui,-apple-system,sans-serif;">
    ${preview}
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${palette.card};border-radius:28px;box-shadow:0 25px 65px rgba(15,23,42,0.12);overflow:hidden;">
            <tr>
              <td style="padding:32px;background:${palette.gradient};color:#fff;">
                <h1 style="margin:0;font-size:28px;">PartsQuote</h1>
                <p style="margin:6px 0 0;font-size:14px;opacity:0.85;">${heading}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${
                  intro
                    ? `<p style="margin:0 0 16px;font-size:16px;color:${palette.text};font-weight:500;">${intro}</p>`
                    : ''
                }
                ${bodyParagraphs}
                ${highlightTable}
                ${ctaButton}
                ${footer}
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:${palette.muted};">
            &copy; ${new Date().getFullYear()} PartsQuote. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
