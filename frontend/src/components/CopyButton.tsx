'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label }: CopyButtonProps) {
  const t = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      ElMessage.success(t('copySuccess'));
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => ElMessage.error(t('copyFailed')));
  };

  return (
    <button
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
