import React from 'react';
import type { AnalysisResult } from '../types';
import { ChartBarIcon, DocumentTextIcon, GlobeAltIcon, BuildingOfficeIcon, LightBulbIcon, ChevronDownIcon, LinkIcon, BanknotesIcon } from './IconComponents';

interface AnalysisDisplayProps {
  analysis: AnalysisResult;
  ticker: string;
}

const getRecommendationClasses = (action: string) => {
  switch (action.toUpperCase()) {
    case 'BUY':
    case 'MUA':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500',
      };
    case 'SELL':
    case 'BÁN':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500',
      };
    case 'HOLD':
    case 'NẮM GIỮ':
      return {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-400',
        border: 'border-yellow-500',
      };
    default:
      return {
        bg: 'bg-gray-700/20',
        text: 'text-gray-300',
        border: 'border-gray-600',
      };
  }
};

const AnalysisSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  // Children for this component can be a string (HTML) or a React node.
  const content = typeof children === 'string'
    ? <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: children }} />
    : children;

  return (
    <details className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden group" open={defaultOpen}>
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
        </div>
        <ChevronDownIcon className="w-5 h-5 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="p-4 border-t border-gray-700">
        {content}
      </div>
    </details>
  );
};


export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, ticker }) => {
  const recommendationClasses = getRecommendationClasses(analysis.recommendation.action);
  const formattedDate = new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' });

  const renderSourcesAsHtml = (sources: AnalysisResult['sources']): string => {
    if (!sources || sources.length === 0) return '';
    const listItems = sources.map(source => 
        `<li><a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 hover:underline">${source.title}</a></li>`
    ).join('');
    return `<ul class="list-disc pl-5 space-y-2 text-gray-300">${listItems}</ul>`;
  }

  return (
    <div className="mt-8 space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-100">
          Báo cáo Phân tích: <span className="text-cyan-400">{ticker}</span>
        </h2>
        <p className="text-gray-400 mt-1">Dữ liệu tính đến cuối ngày {analysis.assumedDate || formattedDate}</p>
        {analysis.closingPrice !== 'N/A' && (
          <p className="text-gray-300 font-semibold">Giá đóng cửa: <span className="text-yellow-400">{analysis.closingPrice}</span></p>
        )}
      </div>

      {/* Recommendation Section */}
      <div className={`${recommendationClasses.bg} border ${recommendationClasses.border} p-6 rounded-xl shadow-lg`}>
        <div className="flex items-center gap-4">
          <LightBulbIcon className={`w-8 h-8 ${recommendationClasses.text}`} />
          <div>
            <h3 className="text-xl font-bold text-gray-100">Khuyến nghị Đầu tư</h3>
            <p className={`text-2xl font-extrabold ${recommendationClasses.text} mt-1`}>
              {analysis.recommendation.action.toUpperCase()}
            </p>
          </div>
        </div>
        <div className="mt-4 prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: analysis.recommendation.details }} />
      </div>

      {/* Analysis Sections */}
      <div className="space-y-4">
        <AnalysisSection title="Phân tích Vĩ mô & Vi mô" icon={<GlobeAltIcon className="w-6 h-6 text-blue-400"/>} defaultOpen>
          {analysis.macro}
        </AnalysisSection>
        <AnalysisSection title="Phân tích Ngành" icon={<BuildingOfficeIcon className="w-6 h-6 text-purple-400"/>}>
          {analysis.industry}
        </AnalysisSection>
        <AnalysisSection title="Phân tích Cơ bản Doanh nghiệp" icon={<DocumentTextIcon className="w-6 h-6 text-orange-400"/>}>
          {analysis.fundamental}
        </AnalysisSection>
        <AnalysisSection title="Phân tích Dòng tiền" icon={<BanknotesIcon className="w-6 h-6 text-teal-400"/>}>
          {analysis.cashFlow}
        </AnalysisSection>
        
        {/* Technical Analysis with Chart */}
        <AnalysisSection title="Phân tích Kỹ thuật" icon={<ChartBarIcon className="w-6 h-6 text-green-400"/>}>
            {analysis.technicalChartImage && (
                <div className="mb-6">
                    <img 
                        src={`data:image/png;base64,${analysis.technicalChartImage}`} 
                        alt={`Biểu đồ phân tích kỹ thuật cho ${ticker}`}
                        className="rounded-lg shadow-lg w-full"
                    />
                </div>
            )}
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: analysis.technical }} />
        </AnalysisSection>

        {/* Data Sources Section */}
        {analysis.sources && analysis.sources.length > 0 && (
          <AnalysisSection title="Nguồn Dữ liệu Tham khảo" icon={<LinkIcon className="w-6 h-6 text-gray-400"/>} defaultOpen>
            {renderSourcesAsHtml(analysis.sources)}
          </AnalysisSection>
        )}
      </div>
    </div>
  );
};