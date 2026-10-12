
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TestAiGenerator } from './TestAiGenerator';
import '@testing-library/jest-dom';

// Mock hàm fetch toàn cục
globalThis.fetch = jest.fn();

describe('TestAiGenerator & useAiPolling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (globalThis.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders default UI correctly', () => {
    render(<TestAiGenerator />);
    
    // Kiểm tra các trường hiển thị đúng
    expect(screen.getByText('Test AI Queue Generation (BullMQ)')).toBeInTheDocument();
    expect(screen.getByText('JWT Token:')).toBeInTheDocument();
    expect(screen.getByText('Prompt:')).toBeInTheDocument();
    
    // Nút sinh ảnh ở trạng thái bình thường
    const button = screen.getByRole('button', { name: 'Tạo ảnh AI' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('handles full polling cycle successfully', async () => {
    render(<TestAiGenerator />);

    // Nhập token
    const tokenInput = screen.getByPlaceholderText('eyJhbGciOiJIUzI1NiIsInR5...');
    fireEvent.change(tokenInput, { target: { value: 'fake-token' } });

    // Mock các phản hồi của fetch theo thứ tự
    // 1. Tạo job thành công -> trả về jobId
    // 2. Trạng thái active -> chưa xong
    // 3. Trạng thái completed -> xong, có imageUrl
    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: { jobId: 'job-123' } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: { state: 'active' } }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ 
          success: true, 
          data: { 
            state: 'completed', 
            result: { imageUrl: 'https://res.cloudinary.com/fake-image.png' } 
          } 
        }),
      });

    // Bấm nút tạo ảnh
    const button = screen.getByRole('button', { name: 'Tạo ảnh AI' });
    
    await act(async () => {
      fireEvent.click(button);
    });

    // Lúc này nút phải bị disable và hiển thị chữ Đang xử lý
    expect(screen.getByRole('button', { name: 'Đang xử lý ngầm (Polling)...' })).toBeDisabled();

    // Tua nhanh 2.5s (lần 1 polling)
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    // Vẫn đang polling (state: active) -> nút vẫn disable
    expect(screen.getByRole('button', { name: 'Đang xử lý ngầm (Polling)...' })).toBeDisabled();

    // Tua nhanh 2.5s (lần 2 polling)
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    // Lúc này state = 'completed', sẽ reset trạng thái nút và hiển thị ảnh
    expect(screen.getByRole('button', { name: 'Tạo ảnh AI' })).not.toBeDisabled();
    
    // Kiểm tra render thẻ img
    const image = await screen.findByAltText('AI Generated Design');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://res.cloudinary.com/fake-image.png');
    
    // Xác minh fetch được gọi đúng số lần
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });
});
