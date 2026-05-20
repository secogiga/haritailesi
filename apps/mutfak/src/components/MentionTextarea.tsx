'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { mutfakApi, type Member } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar } from '@/components/Avatar';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  token: string;
  className?: string;
}

export function MentionTextarea({ value, onChange, placeholder, rows = 5, maxLength, token, className }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mention, setMention] = useState<string | null>(null);
  const [caretPos, setCaretPos] = useState(0);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedMention = useDebounce(mention ?? '', 300);

  useEffect(() => {
    if (!debouncedMention || debouncedMention.length < 2 || !token) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    mutfakApi.listMembers(token, debouncedMention).then((members) => {
      setSuggestions(members.slice(0, 5));
      setShowDropdown(members.length > 0);
    }).catch(() => {
      setSuggestions([]);
      setShowDropdown(false);
    });
  }, [debouncedMention, token]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart ?? 0;
    onChange(val);

    // Find @-mention being typed
    const before = val.slice(0, pos);
    const match = /@([\p{L}\p{N}._-]{0,40})$/u.exec(before);
    if (match) {
      setMention(match[1] ?? '');
      setCaretPos(pos);
    } else {
      setMention(null);
      setShowDropdown(false);
    }
  }, [onChange]);

  function insertMention(displayName: string) {
    const before = value.slice(0, caretPos);
    const after = value.slice(caretPos);
    const atIndex = before.lastIndexOf('@');
    const newValue = before.slice(0, atIndex) + `@${displayName} ` + after;
    onChange(newValue);
    setShowDropdown(false);
    setMention(null);
    setTimeout(() => {
      const pos = atIndex + displayName.length + 2;
      textareaRef.current?.setSelectionRange(pos, pos);
      textareaRef.current?.focus();
    }, 0);
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => { if (e.key === 'Escape') setShowDropdown(false); }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={className}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-20 left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((m) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); insertMention(m.displayName); }}
              className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
            >
              <Avatar name={m.displayName} src={m.avatarUrl} size={28} />
              <div>
                <p className="text-sm font-medium text-gray-900 leading-tight">{m.displayName}</p>
                {m.profession && <p className="text-xs text-gray-400 leading-tight">{m.profession}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
