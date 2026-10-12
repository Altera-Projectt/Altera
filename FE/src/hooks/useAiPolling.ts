import { useState, useRef, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface GeneratePayload {
  prompt: string;
  style?: string;
  shirtColor?: string;
  printSide?: string;
}

export interface UseAiPollingReturn {
  isGenerating: boolean;
  error: string | null;
  imageUrl: string | null;
  currentJobId: string | null;
  generateDesign: (payload: GeneratePayload, token: string) => Promise<void>;
  reset: () => void;
}

export interface UseAiPollingOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useAiPolling = (options?: UseAiPollingOptions): UseAiPollingReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Dùng ref để giữ lại timer ID phục vụ cho việc dọn dẹp
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer cẩn thận
  const clearPollingTimer = useCallback(() => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      clearPollingTimer();
    };
  }, [clearPollingTimer]);

  const pollStatus = useCallback(async (jobId: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/designs/generate/status/${jobId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.message || 'Lỗi không xác định khi lấy trạng thái');
      }

      const { state, result, failedReason } = json.data;

      if (state === 'completed') {
        setImageUrl(result?.imageUrl || result?.preview || null);
        setIsGenerating(false);
        clearPollingTimer();
        if (options?.onSuccess) options.onSuccess(result);
      } else if (state === 'failed') {
        setError(failedReason || 'Job sinh ảnh thất bại.');
        setIsGenerating(false);
        clearPollingTimer();
        if (options?.onError) options.onError(failedReason || 'Job sinh ảnh thất bại.');
      } else if (state === 'active' || state === 'waiting' || state === 'delayed') {
        // Tiếp tục polling sau 2.5s
        pollingTimerRef.current = setTimeout(() => {
          pollStatus(jobId, token);
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi mạng khi gọi API polling');
      setIsGenerating(false);
      clearPollingTimer();
    }
  }, [clearPollingTimer]);

  const generateDesign = useCallback(async (payload: GeneratePayload, token: string) => {
    // Reset state trước khi gửi
    clearPollingTimer();
    setError(null);
    setImageUrl(null);
    setIsGenerating(true);
    setCurrentJobId(null);

    try {
      const response = await fetch(`${API_BASE_URL}/designs/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!json.success || !json.data?.jobId) {
        throw new Error(json.message || 'Không thể tạo Job');
      }

      const jobId = json.data.jobId;
      setCurrentJobId(jobId);

      // Gọi lần poll đầu tiên sau 2.5s
      pollingTimerRef.current = setTimeout(() => {
        pollStatus(jobId, token);
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'Lỗi mạng khi tạo request');
      setIsGenerating(false);
    }
  }, [clearPollingTimer, pollStatus]);

  const reset = useCallback(() => {
    clearPollingTimer();
    setError(null);
    setImageUrl(null);
    setIsGenerating(false);
    setCurrentJobId(null);
  }, [clearPollingTimer]);

  return {
    isGenerating,
    error,
    imageUrl,
    currentJobId,
    generateDesign,
    reset
  };
};
