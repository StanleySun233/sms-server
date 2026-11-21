'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      ElMessage.success(t('copySuccess'));
    } catch {
      ElMessage.error(t('copyFailed'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="px-4 py-2 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: copied ? '#10b981' : 'rgba(194, 144, 94, 0.2)',
        color: '#fff',
      }}
    >
      {copied ? t('copied') : (label ?? t('copy'))}
    </button>
  );
}
