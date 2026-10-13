import { useState } from 'react';
import { useAiPolling, type GeneratePayload } from '../../hooks/useAiPolling';

export const TestAiGenerator: React.FC = () => {
  const [token, setToken] = useState('');
  const [prompt, setPrompt] = useState('A vintage eagle print');
  const [style, setStyle] = useState('Vintage');
  const [shirtColor, setShirtColor] = useState('#ffffff');
  
  const {
    isGenerating,
    error,
    imageUrl,
    currentJobId,
    generateDesign,
  } = useAiPolling();

  const handleGenerate = () => {
    if (!token) {
      alert('Vui lòng nhập Token (JWT)');
      return;
    }
    
    if (!prompt.trim()) {
      alert('Vui lòng nhập Prompt');
      return;
    }

    const payload: GeneratePayload = {
      prompt,
      style,
      shirtColor,
      printSide: 'Front'
    };

    generateDesign(payload, token);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Test AI Queue Generation (BullMQ)</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>JWT Token:</label>
          <input 
            type="text" 
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prompt:</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Style:</label>
            <input 
              type="text" 
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Shirt Color (Hex):</label>
            <input 
              type="text" 
              value={shirtColor}
              onChange={(e) => setShirtColor(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={isGenerating}
          style={{
            padding: '12px 20px',
            backgroundColor: isGenerating ? '#aaa' : '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {isGenerating ? 'Đang xử lý ngầm (Polling)...' : 'Tạo ảnh AI'}
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        {currentJobId && (
          <p style={{ color: '#555' }}>
            <strong>Job ID:</strong> {currentJobId}
          </p>
        )}
        
        {error && (
          <div style={{ padding: '15px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginTop: '10px' }}>
            <strong>Lỗi:</strong> {error}
          </div>
        )}
        
        {imageUrl && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <h3 style={{ color: '#2e7d32' }}>✅ Kết quả sinh ảnh:</h3>
            <img 
              src={imageUrl} 
              alt="AI Generated Design" 
              style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};
