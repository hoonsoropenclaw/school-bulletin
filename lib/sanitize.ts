// HTML sanitizer - 防 XSS 攻擊
// 公告內容是處室用 Tiptap 編輯的 HTML,顯示前必過白名單

import sanitize from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'span',
  'a', 'ul', 'ol', 'li',
];

export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
      span: ['style', 'class'],
      p: ['style', 'class'],
    },
    allowedStyles: {
      '*': {
        'color': [/^#[0-9a-fA-F]{3,8}$/],
        'background-color': [/^#[0-9a-fA-F]{3,8}$/],
        'font-size': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
        'font-weight': [/^(?:bold|normal|\d+)$/],
        'text-decoration': [/^(?:underline|line-through|none)$/],
        'text-align': [/^(?:left|right|center|justify)$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
  });
}
