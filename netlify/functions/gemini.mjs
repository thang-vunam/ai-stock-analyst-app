import { GoogleGenAI } from "@google/genai";

// Các hàm helper được chuyển từ services/geminiService.ts sang đây
const cleanJsonString = (str) => {
  const markdownMatch = str.match(/```json\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return str.substring(firstBrace, lastBrace + 1).trim();
  }
  return str.trim();
};

const generateAnalysisPrompt = (tickerSymbol) => `
Bạn là một nhà phân tích tài chính chuyên nghiệp, chuyên sâu về thị trường chứng khoán Việt Nam.
**Nhiệm vụ:** Tạo một báo cáo phân tích toàn diện cho mã cổ phiếu hoặc chỉ số: "${tickerSymbol}", sử dụng phương pháp phân tích từ trên xuống (top-down).
**QUY TẮC QUAN TRỌNG VỀ TRÍCH DẪN NGUỒN:** Hệ thống sẽ tự động thêm các trích dẫn nguồn dạng số (ví dụ: [1], [2]) vào nội dung bạn viết. Bạn chỉ cần tập trung vào việc cung cấp thông tin chính xác và chất lượng cao từ các nguồn tìm kiếm được.
**Cấu trúc Phân tích:**
1. **Phân tích Vĩ mô & Vi mô:** Tóm tắt điều kiện kinh tế, nhấn mạnh số liệu quan trọng (GDP, lạm phát, lãi suất), và tác động đến thị trường.
2. **Phân tích Ngành:** Phân tích xu hướng, tốc độ tăng trưởng, chu kỳ, rủi ro và động lực của ngành.
3. **Phân tích Cơ bản Doanh nghiệp:** Tổng quan mô hình kinh doanh, thị phần, lợi thế cạnh tranh, và phân tích các chỉ số tài chính (doanh thu, lợi nhuận, ROE, P/E, P/B).
4. **Phân tích Dòng tiền:** Phân tích giao dịch khối ngoại/tự doanh, đột biến khối lượng, và các chỉ báo dòng tiền (MFI, OBV) để nhận định dòng tiền lớn.
5. **Phân tích Kỹ thuật:** Phân tích biểu đồ giá, xu hướng, hỗ trợ/kháng cự, và các chỉ báo (RSI, MACD, MA, Khối lượng).
6. **Kết luận & Khuyến nghị Đầu tư:** Đưa ra khuyến nghị **MUA / BÁN / NẮM GIỮ** kèm vùng giá cụ thể, lợi nhuận tiềm năng, và mức dừng lỗ.
**Yêu cầu về Định dạng Đầu ra:** Toàn bộ phản hồi PHẢI là một đối tượng JSON duy nhất với cấu trúc: { "assumedDate": "string", "closingPrice": "string", "macro": "string", "industry": "string", "fundamental": "string", "technical": "string", "cashFlow": "string", "recommendation": { "action": "string", "details": "string" } }
`;

const generateChartPrompt = (ticker) => `Create a professional, dark-theme stock chart for a financial report on the ticker "${ticker}". Requirements: 1. Type: Candlestick chart for the last 6-12 months. 2. Indicators: MA50, MA200, RSI, and MACD. 3. Theme: Dark theme, high-contrast colors. 4. Clarity: Ticker symbol visible, axes labeled. 5. No fictitious data.`;

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { ticker } = await req.json();
    if (!ticker) {
      return new Response(JSON.stringify({ error: "Ticker symbol is required" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key is not configured on the server" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const ai = new GoogleGenAI({ apiKey });

    const analysisPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: generateAnalysisPrompt(ticker),
      config: { tools: [{ googleSearch: {} }] },
    });

    const imagePromise = (async () => {
      try {
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: generateChartPrompt(ticker),
          config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '16:9' },
        });
        return imageResponse.generatedImages?.[0]?.image?.imageBytes || null;
      } catch (imageError) {
        console.warn("Could not generate technical chart:", imageError);
        return null;
      }
    })();

    const [analysisResponse, technicalChartImage] = await Promise.all([analysisPromise, imagePromise]);
    
    const rawJsonText = analysisResponse.text;
    const cleanedJson = cleanJsonString(rawJsonText);
    const parsedData = JSON.parse(cleanedJson);

    const sources = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map(chunk => ({
        title: chunk.web?.title ?? 'N/A',
        uri: chunk.web?.uri ?? '#',
      }))
      .filter(source => source.uri !== '#') ?? [];

    const resultForClient = { ...parsedData, sources, technicalChartImage };

    return new Response(JSON.stringify(resultForClient), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in Netlify function:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};