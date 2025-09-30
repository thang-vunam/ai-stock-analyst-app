import React from 'react';

const loadingMessages = [
  "Đang phân tích dữ liệu vĩ mô...",
  "Đang đánh giá xu hướng ngành...",
  "Đang kiểm tra các chỉ số tài chính...",
  "Đang vẽ biểu đồ kỹ thuật...",
  "Tổng hợp khuyến nghị đầu tư..."
];

export const LoadingSpinner: React.FC = () => {
    const [message, setMessage] = React.useState(loadingMessages[0]);
    
    React.useEffect(() => {
        const intervalId = setInterval(() => {
            setMessage(prevMessage => {
                const currentIndex = loadingMessages.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % loadingMessages.length;
                return loadingMessages[nextIndex];
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-gray-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-4 border-t-cyan-400 border-gray-700 animate-spin [animation-direction:reverse]"></div>
            </div>
            <p className="text-lg text-gray-300 font-medium transition-opacity duration-500">{message}</p>
        </div>
    );
};