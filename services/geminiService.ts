import { GoogleGenAI } from "@google/genai";
import type { AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Cleans the raw string response from Gemini to extract the JSON part.
 * It handles cases where the JSON is wrapped in markdown code blocks or has extraneous text.
 * @param str The raw string response.
 * @returns A cleaned string that should be valid JSON.
 */
const cleanJsonString = (str: string): string => {
  // First, try to extract from a markdown code block
  const markdownMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

  // If no markdown block, find the first '{' and last '}'
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return str.substring(firstBrace, lastBrace + 1).trim();
  }
  
  // As a fallback, return the trimmed original string
  return str.trim();
};


/**
 * Converts a string with markdown-like syntax and URLs into a safe HTML string.
 * It now also handles grounding citations like [1, 2] and turns them into clickable links.
 * @param text The input text from the AI.
 * @param sources The array of source objects from grounding metadata.
 * @returns An HTML string.
 */
function markdownToHtml(text: string, sources: AnalysisResult['sources'] = []): string {
    if (!text) return '';

    // Escape basic HTML characters to prevent XSS
    let escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
        
    // Convert grounding citations like [1, 2, 7] into clickable links
    escapedText = escapedText.replace(/\[([\d,\s]+)\]/g, (match, numbers) => {
        const numberArray = numbers.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
        
        if (numberArray.length === 0) return match; // Return original if parsing fails

        const links = numberArray.map(num => {
            // Gemini grounding citations are 1-based, array is 0-based.
            const sourceIndex = num - 1;
            if (sources && sourceIndex >= 0 && sourceIndex < sources.length) {
                const source = sources[sourceIndex];
                // Escape title to prevent XSS from source title
                const escapedTitle = source.title.replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                return `<a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline" title="${escapedTitle}">${num}</a>`;
            }
            return num.toString(); // Fallback if source not found
        }).join(', ');
        
        return `<sup>[${links}]</sup>`;
    });

    // Convert **bold** to <strong>
    escapedText = escapedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    escapedText = escapedText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert lists starting with * or -
    escapedText = escapedText.replace(/^\s*[\*-]\s+(.*)/gm, '<li>$1</li>');
    escapedText = escapedText.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    escapedText = escapedText.replace(/<\/li>\s*<ul>/g, '<ul>').replace(/<\/ul>\s*<li>/g, '</li><li>');

    // Convert newlines to <p> tags for paragraphs
    escapedText = escapedText.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '').join('');

    // Convert explicit URLs in parentheses to clickable links as a fallback
    escapedText = escapedText.replace(/\((https?:\/\/[^\s)]+)\)/g, 
        ' <a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">[Link]</a>');
    
    return escapedText;
}


const generateAnalysisPrompt = (tickerSymbol: string) => `
Bạn là một nhà phân tích tài chính chuyên nghiệp, chuyên sâu về thị trường chứng khoán Việt Nam.

**Nhiệm vụ:**
Tạo một báo cáo phân tích toàn diện cho mã cổ phiếu hoặc chỉ số: "${tickerSymbol}", sử dụng phương pháp phân tích từ trên xuống (top-down).

**QUY TẮC QUAN TRỌNG VỀ TRÍCH DẪN NGUỒN:**
Hệ thống sẽ tự động thêm các trích dẫn nguồn dạng số (ví dụ: [1], [2]) vào nội dung bạn viết. Bạn chỉ cần tập trung vào việc cung cấp thông tin chính xác và chất lượng cao từ các nguồn tìm kiếm được.

**Cấu trúc Phân tích:**

**1. Phân tích Vĩ mô & Vi mô:**
   - Tóm tắt điều kiện kinh tế vĩ mô của Việt Nam và toàn cầu.
   - Nhấn mạnh các số liệu quan trọng (GDP, lạm phát, lãi suất, chính sách tiền tệ, tỷ giá).
   - Phân tích tác động đến thị trường chứng khoán Việt Nam và ngành của cổ phiếu.

**2. Phân tích Ngành:**
   - Phân tích xu hướng, tốc độ tăng trưởng, chu kỳ ngành, rủi ro và động lực chính.
   - Đánh giá triển vọng ngắn, trung và dài hạn.

**3. Phân tích Cơ bản Doanh nghiệp:**
   - Tổng quan: mô hình kinh doanh, thị phần, lợi thế cạnh tranh.
   - Phân tích chỉ số tài chính: doanh thu, lợi nhuận, biên lợi nhuận, ROE, P/E, P/B, nợ/vốn chủ sở hữu.
   - So sánh với các công ty cùng ngành.

**4. Phân tích Dòng tiền:**
   - Phân tích các giao dịch của khối ngoại và tự doanh.
   - Phân tích các đột biến về khối lượng giao dịch để xác định dấu hiệu của dòng tiền lớn.
   - Đánh giá các chỉ báo dòng tiền như MFI (Money Flow Index), OBV (On-Balance Volume).
   - Đưa ra nhận định về việc dòng tiền lớn đang vào (tích lũy) hay ra (phân phối) khỏi cổ phiếu.

**5. Phân tích Kỹ thuật:**
   - Phân tích biểu đồ giá (ngắn, trung, dài hạn).
   - Sử dụng các chỉ báo chính: RSI, MACD, MA20/50/200, Khối lượng.
   - Xác định xu hướng, vùng hỗ trợ/kháng cự.

**6. Kết luận & Khuyến nghị Đầu tư:**
   - Đưa ra khuyến nghị: **MUA / BÁN / NẮM GIỮ**.
   - **BẮT BUỘC:** Đưa ra vùng giá mua/bán cụ thể dựa trên giá đóng cửa của phiên gần nhất.
   - Ước tính lợi nhuận tiềm năng và mức dừng lỗ (%).
   - Lý giải khuyến nghị dựa trên sự kết hợp của cả phân tích cơ bản, kỹ thuật và dòng tiền.

**Yêu cầu về Định dạng Đầu ra:**
Toàn bộ phản hồi PHẢI được định dạng dưới dạng một đối tượng JSON duy nhất. KHÔNG bao gồm bất kỳ văn bản nào bên ngoài đối tượng JSON.

Cấu trúc JSON phải chính xác như sau:
\`\`\`json
{
  "assumedDate": "string (Ngày của dữ liệu, ví dụ: '26/09/2025')",
  "closingPrice": "string (Giá đóng cửa của phiên gần nhất, ví dụ: '16,500 VND')",
  "macro": "string (Nội dung phân tích vĩ mô & vi mô)",
  "industry": "string (Nội dung phân tích ngành)",
  "fundamental": "string (Nội dung phân tích cơ bản doanh nghiệp)",
  "technical": "string (Nội dung phân tích kỹ thuật)",
  "cashFlow": "string (Nội dung phân tích dòng tiền)",
  "recommendation": {
    "action": "string ('MUA', 'BÁN', hoặc 'NẮM GIỮ')",
    "details": "string (Chi tiết và lý giải cho khuyến nghị)"
  }
}
\`\`\`
`;

const generateChartPrompt = (ticker: string): string => {
    return `Create a professional, dark-theme stock chart for a financial report on the ticker "${ticker}".

Requirements:
1.  **Type:** Candlestick chart for the last 6-12 months.
2.  **Indicators:**
    *   Moving Averages: MA50 and MA200 clearly plotted on the price chart.
    *   RSI indicator in a separate panel below the price chart.
    *   MACD indicator (with histogram and signal lines) in a separate panel below RSI.
3.  **Theme:** Dark theme with a black or dark gray background, clear grid lines, and high-contrast colors for candles and indicators (e.g., green for up, red for down).
4.  **Clarity:** The ticker symbol "${ticker}" should be visible. Axes must be clearly labeled.
5.  **No fictitious data:** The chart should look realistic and professional, reflecting common price action patterns.
`;
}


export const fetchStockAnalysis = async (tickerSymbol: string): Promise<AnalysisResult> => {
  const modelName = 'gemini-2.5-flash';
  const imageModelName = 'imagen-4.0-generate-001';

  const analysisPrompt = generateAnalysisPrompt(tickerSymbol);
  const chartPrompt = generateChartPrompt(tickerSymbol);

  try {
    // --- Create Promises for both API calls ---
    const analysisPromise = ai.models.generateContent({
        model: modelName,
        contents: analysisPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
    });

    // Create a self-contained promise for the image that resolves to the image string or null on error
    const imagePromise = (async () => {
        try {
            const imageResponse = await ai.models.generateImages({
                model: imageModelName,
                prompt: chartPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: '16:9',
                },
            });
            if (imageResponse.generatedImages && imageResponse.generatedImages.length > 0) {
                return imageResponse.generatedImages[0].image.imageBytes;
            }
            return null;
        } catch (imageError) {
            console.warn("Không thể tạo biểu đồ kỹ thuật:", imageError);
            return null; // Resolve with null instead of rejecting, so Promise.all doesn't fail
        }
    })();

    // --- Run both requests in parallel ---
    const [analysisResponse, technicalChartImage] = await Promise.all([analysisPromise, imagePromise]);

    // --- Process Text Analysis Result ---
    const rawJsonText = analysisResponse.text;
    if (!rawJsonText) {
      throw new Error("API không trả về nội dung phân tích.");
    }

    const cleanedJson = cleanJsonString(rawJsonText);
    let parsedData: Partial<AnalysisResult>;

    try {
        parsedData = JSON.parse(cleanedJson);
    } catch (e) {
        console.error("Lỗi phân tích JSON:", cleanedJson);
        throw new Error("Không thể phân tích phản hồi từ AI. Định dạng có thể không hợp lệ.");
    }
    
    const sources = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => ({
        title: chunk.web?.title ?? 'N/A',
        uri: chunk.web?.uri ?? '#',
      }))
      .filter(source => source.uri !== '#') ?? [];

    const recommendation = parsedData.recommendation || { 
        action: 'N/A', 
        details: 'Không có khuyến nghị chi tiết do lỗi phân tích dữ liệu.' 
    };

    // --- Assemble Final Result ---
    const finalResult: AnalysisResult = {
      assumedDate: parsedData.assumedDate || new Date().toLocaleDateString('vi-VN'),
      closingPrice: parsedData.closingPrice || 'N/A',
      macro: markdownToHtml(parsedData.macro || '', sources),
      industry: markdownToHtml(parsedData.industry || '', sources),
      fundamental: markdownToHtml(parsedData.fundamental || '', sources),
      technical: markdownToHtml(parsedData.technical || '', sources),
      cashFlow: markdownToHtml(parsedData.cashFlow || '', sources),
      recommendation: {
          action: recommendation.action || 'N/A',
          details: markdownToHtml(recommendation.details, sources)
      },
      sources,
      technicalChartImage, // This comes directly from the parallel promise
    };

    return finalResult;

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    if (error instanceof Error && !error.message.includes('JSON')) {
        throw new Error(`Đã xảy ra lỗi khi phân tích: ${error.message}`);
    }
    // Re-throw the specific JSON parsing error
    if (error instanceof Error && error.message.includes('JSON')) {
        throw error;
    }
    throw new Error("Đã có lỗi không xác định xảy ra khi giao tiếp với AI.");
  }
};