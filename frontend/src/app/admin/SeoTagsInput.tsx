'use client';

/**
 * SeoTagsInput — Professional tag-chip input for admin SEO fields.
 *
 * Features:
 *  - Chip/pill display for each tag
 *  - Add via Enter / comma key
 *  - Remove chip via × button or Backspace
 *  - Copy all tags → clipboard (& stores in sessionStorage for paste)
 *  - Paste tags from last copied set with one click
 *  - Duplicate prevention, lowercase normalisation
 *  - Live `<meta keywords>` preview
 */

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Tag, Copy, ClipboardPaste, X, Search, CheckCircle2 } from 'lucide-react';

const SESSION_KEY = 'admin_copied_seo_tags';

interface SeoTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function SeoTagsInput({ tags, onChange }: SeoTagsInputProps) {
  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [hasPasteData, setHasPasteData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if clipboard has stored tags
  useEffect(() => {
    setHasPasteData(!!sessionStorage.getItem(SESSION_KEY));
  }, []);

  const normalise = (raw: string) =>
    raw
      .toLowerCase()
      .replace(/[^a-z0-9äöüßàâéêèîïôùûç\- ]/gi, '')
      .trim();

  const addTag = (raw: string) => {
    const parts = raw.split(',').map(normalise).filter(Boolean);
    if (!parts.length) return;
    const next = [...new Set([...tags, ...parts])];
    onChange(next);
    setInputVal('');
  };

  const removeTag = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === 'Backspace' && inputVal === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handleCopy = async () => {
    const csv = tags.join(', ');
    try {
      await navigator.clipboard.writeText(csv);
    } catch (_) {}
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(tags));
    setHasPasteData(true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaste = () => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const stored: string[] = JSON.parse(raw);
      const next = [...new Set([...tags, ...stored])];
      onChange(next);
    } catch (_) {}
  };

  const previewKeywords = tags.join(', ') || '—';

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Search className="w-3 h-3 text-stone-400" />
          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
            SEO Keywords / Tags
          </label>
          <span className="text-[9px] text-stone-400 font-normal">
            — Press Enter or comma to add
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Paste */}
          <button
            type="button"
            onClick={handlePaste}
            disabled={!hasPasteData}
            title="Paste tags from last copied set"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition border ${
              hasPasteData
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer'
                : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
            }`}
          >
            <ClipboardPaste className="w-3 h-3" />
            Paste Tags
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={tags.length === 0}
            title="Copy all tags — use on another product"
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition border ${
              tags.length > 0
                ? copied
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 cursor-pointer'
                : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy Tags
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chip input area */}
      <div
        className="flex flex-wrap gap-1.5 min-h-[44px] w-full border border-stone-200 bg-stone-50/60 rounded-xl px-3 py-2 focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900/5 focus-within:bg-white transition cursor-text shadow-sm"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 bg-stone-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide"
          >
            <Tag className="w-2.5 h-2.5 opacity-70" />
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(idx); }}
              className="ml-0.5 hover:text-rose-300 transition"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputVal.trim()) addTag(inputVal); }}
          placeholder={tags.length === 0 ? 'fragrance, luxury, oud, summer...' : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-stone-900 focus:outline-none placeholder-stone-300"
        />
      </div>

      {/* Live SEO preview */}
      <div className="flex items-start gap-1.5 px-1">
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5 shrink-0">
          Preview:
        </span>
        <p className="text-[10px] text-stone-400 leading-relaxed font-mono truncate">
          {previewKeywords}
        </p>
      </div>

      {/* Count badge */}
      {tags.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-stone-400">
            {tags.length} tag{tags.length !== 1 ? 's' : ''} · Used as{' '}
            <code className="text-[9px] bg-stone-100 px-1 py-0.5 rounded text-stone-600">
              {'<meta name="keywords">'}
            </code>{' '}
            on product pages
          </span>
        </div>
      )}
    </div>
  );
}
