/**
 * Lightweight Markdown renderer (changelog display only). Handles the subset
 * GitHub release notes actually use: #/##/### headers, **bold**, *italic*,
 * and "- " bullet lists. Not a general-purpose parser.
 * (Split out of App.jsx.)
 */
import React from "react";

export function renderMarkdownInline(line, key) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(line))) {
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
    parts.push(
      match[1] !== undefined
        ? <strong key={`${key}-b${match.index}`}>{match[1]}</strong>
        : <em key={`${key}-i${match.index}`}>{match[2]}</em>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) parts.push(line.slice(lastIndex));
  return parts;
}

export function renderMarkdown(text) {
  if (!text) return null;
  const blocks = [];
  let listItems = null;
  const flushList = () => {
    if (listItems) {
      blocks.push(<ul key={`ul-${blocks.length}`} style={{ margin: "4px 0 10px 20px", padding: 0 }}>{listItems}</ul>);
      listItems = null;
    }
  };
  text.split("\n").forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.trim() === "") { flushList(); return; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushList();
      const sizes = { 1: 18, 2: 16, 3: 14, 4: 13 };
      blocks.push(
        <div key={`h-${idx}`} style={{ fontSize: sizes[h[1].length] || 13, fontWeight: 700, color: "var(--gold2)", marginTop: idx === 0 ? 0 : 12, marginBottom: 4 }}>
          {renderMarkdownInline(h[2], `h-${idx}`)}
        </div>
      );
      return;
    }

    const b = line.match(/^[-*]\s+(.*)$/);
    if (b) {
      if (!listItems) listItems = [];
      listItems.push(<li key={`li-${idx}`} style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4, lineHeight: 1.5 }}>{renderMarkdownInline(b[1], `li-${idx}`)}</li>);
      return;
    }

    flushList();
    blocks.push(<div key={`p-${idx}`} style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6, lineHeight: 1.5 }}>{renderMarkdownInline(line, `p-${idx}`)}</div>);
  });
  flushList();
  return blocks;
}
