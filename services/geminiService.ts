import type { AnalysisResult } from '../types';

// Hàm markdownToHtml vẫn ở lại phía client để xử lý dữ liệu
function markdownToHtml(text: string, sources: AnalysisResult['sources'] = []): string {
    if (!text) return '';
    let escapedText = text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    escapedText = escapedText.replace(/\[([\d,\s]+)\]/g, (match, numbers) => {
        const numberArray = numbers.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        if (numberArray.length === 0) return match;
        const links = numberArray.map(num => {
            const sourceIndex = num - 1;
            if (sources && sourceIndex >= 0 && sourceIndex < sources.length) {
                const source = sources[sourceIndex];
                const escapedTitle = source.title.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                return `<a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline" title="${escapedTitle}">${num}</a>`;
            }
            return num.toString();
        }).join(', ');
        return `<sup>[${links}]</sup>`;
    });
    escapedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escapedText = escapedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    escapedText = escapedText.replace(/^\s*[\*-]\s+(.*)/gm, '<li>$1</li>');
    escapedText = escapedText.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>').replace(/<\/ul>\s*<li>/g, '</li><li>');
    escapedText = escapedText.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '').join('');
    escapedText = escapedText.replace(/\((https?:\/\/[^\s)]+)\)/g, ' <a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">[Link]</a>');
    return escapedText;
}

export const fetchStockAnalysis = async (tickerSymbol: string): Promise<AnalysisResult> => {
    // Gọi đến "trạm trung chuyển" an toàn của chúng ta thay vì gọi Google trực tiếp
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticker: tickerSymbol }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Server responded with status ${response.status}` }));
        throw new Error(errorData.error || `An unknown server error occurred.`);
    }

    const data = await response.json();

    const recommendation = data.recommendation || {
        action: 'N/A',
        details: 'Không có khuyến nghị chi tiết.'
    };

    // Chuyển đổi dữ liệu thô nhận được thành HTML để hiển thị
    const finalResult: AnalysisResult = {
        assumedDate: data.assumedDate || new Date().toLocaleDateString('vi-VN'),
        closingPrice: data.closingPrice || 'N/A',
        macro: markdownToHtml(data.macro || '', data.sources),
        industry: markdownToHtml(data.industry || '', data.sources),
        fundamental: markdownToHtml(data.fundamental || '', data.sources),
        technical: markdownToHtml(data.technical || '', data.sources),
        cashFlow: markdownToHtml(data.cashFlow || '', data.sources),
        recommendation: {
            action: recommendation.action || 'N/A',
            details: markdownToHtml(recommendation.details, data.sources)
        },
        sources: data.sources || [],
        technicalChartImage: data.technicalChartImage || null,
    };

    return finalResult;
}