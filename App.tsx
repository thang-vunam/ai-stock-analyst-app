import React, { useState, useCallback } from 'react';
import { TickerInput } from './components/TickerInput';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { fetchStockAnalysis } from './services/geminiService';
import type { AnalysisResult, AnalysisError } from './types';
import { ChartBarIcon, GlobeAltIcon, SparklesIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AnalysisError | null>(null);
  const [ticker, setTicker] = useState<string>('');

  const handleAnalyze = useCallback(async (tickerSymbol: string) => {
    if (!tickerSymbol) return;
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    setTicker(tickerSymbol.toUpperCase());

    try {
      const result = await fetchStockAnalysis(tickerSymbol);
      setAnalysis(result);
    } catch (err) {
      setError({
        title: "Lỗi Phân Tích",
        message: err instanceof Error ? err.message : "Đã có lỗi không xác định xảy ra. Vui lòng thử lại sau.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ErrorDisplay: React.FC<{ error: AnalysisError }> = ({ error }) => (
    <div className="mt-8 text-center bg-red-900/20 border border-red-600 p-6 rounded-lg max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-red-400">{error.title}</h3>
      <p className="text-red-300 mt-2">{error.message}</p>
    </div>
  );

  const WelcomeScreen: React.FC = () => (
    <div className="text-center max-w-3xl mx-auto mt-12">
      <div className="flex justify-center items-center gap-4">
        <SparklesIcon className="w-12 h-12 text-cyan-400" />
        <h1 className="text-4xl font-bold text-gray-100">
          AI Stock Analyst
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-400">
        Phân tích chuyên sâu thị trường chứng khoán Việt Nam.
        <br />
        Nhập một mã cổ phiếu hoặc chỉ số (ví dụ: FPT, HPG, VN-INDEX) để bắt đầu.
      </p>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-8 h-8 text-blue-400"/>
            <h3 className="text-xl font-semibold text-gray-200">Phân Tích Toàn Diện</h3>
          </div>
          <p className="mt-2 text-gray-400">Từ vĩ mô, ngành, đến phân tích cơ bản và kỹ thuật của doanh nghiệp.</p>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-green-400"/>
            <h3 className="text-xl font-semibold text-gray-200">Khuyến Nghị Đầu Tư</h3>
          </div>
          <p className="mt-2 text-gray-400">Nhận khuyến nghị MUA/BÁN/NẮM GIỮ rõ ràng kèm mục tiêu giá cụ thể.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Phân tích đầu tư
          </h1>
          <p className="text-gray-400 mt-2">by thangvu</p>
        </header>

        <main>
          <TickerInput onAnalyze={handleAnalyze} isLoading={isLoading} />

          {isLoading && <LoadingSpinner />}
          {error && <ErrorDisplay error={error} />}
          
          {!isLoading && !error && analysis && (
            <AnalysisDisplay analysis={analysis} ticker={ticker} />
          )}

          {!isLoading && !error && !analysis && <WelcomeScreen />}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>Tuyên bố miễn trừ trách nhiệm: Thông tin chỉ mang tính chất tham khảo, không phải là lời khuyên đầu tư.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;