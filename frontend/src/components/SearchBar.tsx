'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (params: {
    keyword?: string;
    phone?: string;
    start_time?: string;
    end_time?: string;
  }) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [phone, setPhone] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      keyword: keyword || undefined,
      phone: phone || undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-lg" style={{
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="按关键词搜索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="px-4 py-2 rounded-lg text-white placeholder-white/50"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
        <input
          type="text"
          placeholder="按号码筛选..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-4 py-2 rounded-lg text-white placeholder-white/50"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
        <input
          type="datetime-local"
          placeholder="开始时间"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="px-4 py-2 rounded-lg text-white"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
        <input
          type="datetime-local"
          placeholder="结束时间"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="px-4 py-2 rounded-lg text-white"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
      </div>
      <button
        type="submit"
        className="w-full px-6 py-2 rounded-lg font-medium transition-all duration-200"
        style={{ backgroundColor: '#c2905e', color: '#fff' }}
      >
        搜索
      </button>
    </form>
  );
}
