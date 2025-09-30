import React, { useState } from 'react';

interface TickerInputProps {
  onAnalyze: (ticker: string) => void;
  isLoading: boolean;
}

export const TickerInput: React.FC<TickerInputProps> = ({ onAnalyze, isLoading }) => {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim() && !isLoading) {
      onAnalyze(ticker.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2 bg-gray-800 border border-gray-700 rounded-full shadow-lg">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Nhập mã cổ phiếu hoặc chỉ số (VD: FPT, VN-INDEX)"
          className="w-full bg-transparent text-gray-200 text-lg placeholder-gray-500 focus:outline-none px-4 py-2"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !ticker.trim()}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xử lý...
            </>
          ) : (
            'Phân tích'
          )}
        </button>
      </form>
    </div>
  );
};