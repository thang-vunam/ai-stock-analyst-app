export interface AnalysisResult {
  assumedDate: string;
  closingPrice: string;
  macro: string;
  industry: string;
  fundamental: string;
  technical: string;
  cashFlow: string;
  technicalChartImage: string | null; // Added for the chart image
  recommendation: {
    action: 'MUA' | 'BÁN' | 'NẮM GIỮ' | 'N/A';
    details: string;
  };
  sources: Array<{
    title: string;
    uri: string;
  }>;
}

export interface AnalysisError {
    title: string;
    message: string;
}