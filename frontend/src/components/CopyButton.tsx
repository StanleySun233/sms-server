'use client';

import { useState } from 'react';
import { ElMessage } from 'element-plus';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label = '复制' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      ElMessage.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      ElMessage.error('复制失败');
    }
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
      {copied ? '已复制' : label}
    </button>
  );
}
