import React, { useState, useCallback } from 'react';
import { createAvatarClient, AvatarSDKError, ErrorCodes } from '../src/index';

/**
 * React integration example for the Avatar SDK
 * This example shows how to integrate the Avatar SDK with React
 */

// Mock wallet provider for React demo purposes
const createMockProvider = () => ({
  getAddress: async () => '0x54b06711C8022faf11EC347F2bDc68A91eA03a3a',
  signMessage: async (message: string) => {
    console.log('Signing message:', message.substring(0, 50) + '...');
    return '0x' + 'd'.repeat(130);
  },
  getChainId: async () => 1
});

// In a real app, you can pass wallet clients directly from wagmi, ethers, or viem:
// 
// Example with wagmi (v2):
// import { useWalletClient } from 'wagmi'
// const { data: walletClient } = useWalletClient()
// provider: walletClient  // Pass wagmi's wallet client directly!
//
// Example with ethers:
// import { useEthersProvider, useEthersSigner } from './your-ethers-hooks'
// const signer = useEthersSigner()
// provider: signer  // Pass ethers signer directly!
//
// No need to create adapter objects - the SDK handles it automatically!

/**
 * Avatar Uploader Component
 */
export function AvatarUploader() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subname, setSubname] = useState('myavatar.offchainsub.eth');

  const handleUpload = useCallback(async (file: File, type: 'avatar' | 'header') => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const client = createAvatarClient({
        domain: 'example.com',
        network: 'mainnet',
        provider: createMockProvider()
      });

      const uploadFunction = type === 'avatar' ? client.uploadAvatar : client.uploadHeader;
      
      const result = await uploadFunction({
        subname,
        file,
        onProgress: setProgress
      });

      setResult(result.url);
      console.log(`${type} uploaded:`, result.url);
    } catch (err) {
      const errorMessage = err instanceof AvatarSDKError 
        ? `Error ${err.code}: ${err.message}`
        : err instanceof Error 
        ? err.message 
        : 'Unknown error occurred';
      
      setError(errorMessage);
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }, [subname]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'header') => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file, type);
    }
  }, [handleUpload]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Avatar SDK - React Integration</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          ENS Subname:
          <input
            type="text"
            value={subname}
            onChange={(e) => setSubname(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
            placeholder="myavatar.offchainsub.eth"
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Upload Avatar (Max 2MB)</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'avatar')}
          disabled={uploading}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Upload Header (Max 5MB)</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'header')}
          disabled={uploading}
        />
      </div>

      {uploading && (
        <div style={{ marginBottom: '20px' }}>
          <div>Uploading... {progress.toFixed(1)}%</div>
          <div style={{ 
            width: '100%', 
            height: '20px', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          color: 'green', 
          backgroundColor: '#e8f5e8', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Success!</strong> Image uploaded: <a href={result} target="_blank" rel="noopener noreferrer">{result}</a>
          <div style={{ marginTop: '10px' }}>
            <img src={result} alt="Uploaded" style={{ maxWidth: '200px', maxHeight: '200px' }} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Manual Upload Component (without provider)
 */
export function ManualAvatarUploader() {
  const [subname, setSubname] = useState('myavatar.offchainsub.eth');
  const [address, setAddress] = useState('0x54b06711C8022faf11EC347F2bDc68A91eA03a3a');
  const [siweMessage, setSiweMessage] = useState<string | null>(null);
  const [signature, setSignature] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const client = createAvatarClient({ 
    domain: 'example.com',
    network: 'mainnet' 
  });

  const generateSIWEMessage = useCallback(async () => {
    try {
      const siweResult = await client.getSIWEMessageForAvatar({ 
        address
        // domain is automatically used from initialization
      });
      setSiweMessage(siweResult.message);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate SIWE message');
    }
  }, [address, client]);

  const uploadWithSignature = useCallback(async () => {
    if (!file || !siweMessage || !signature) {
      setError('Please provide file, SIWE message, and signature');
      return;
    }

    try {
      const result = await client.uploadAvatarWithSignature({
        subname,
        file,
        message: siweMessage,
        signature,
        address
      });

      setResult(result.url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
  }, [subname, file, siweMessage, signature, address, client]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Manual Avatar Upload (Advanced)</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          ENS Subname:
          <input
            type="text"
            value={subname}
            onChange={(e) => setSubname(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Wallet Address:
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px', width: '400px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label>
          Select File:
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginLeft: '10px' }}
          />
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={generateSIWEMessage} style={{ padding: '10px 20px' }}>
          Generate SIWE Message
        </button>
      </div>

      {siweMessage && (
        <div style={{ marginBottom: '15px' }}>
          <label>
            SIWE Message:
            <textarea
              value={siweMessage}
              readOnly
              style={{ 
                marginLeft: '10px', 
                padding: '5px', 
                width: '100%', 
                height: '100px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            />
          </label>
        </div>
      )}

      {siweMessage && (
        <div style={{ marginBottom: '15px' }}>
          <label>
            Signature:
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="0x..."
              style={{ marginLeft: '10px', padding: '5px', width: '500px' }}
            />
          </label>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={uploadWithSignature} 
          disabled={!file || !siweMessage || !signature}
          style={{ padding: '10px 20px' }}
        >
          Upload with Signature
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ 
          color: 'green', 
          backgroundColor: '#e8f5e8', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Success!</strong> Image uploaded: <a href={result} target="_blank" rel="noopener noreferrer">{result}</a>
        </div>
      )}
    </div>
  );
}

/**
 * Error Handling Component
 */
export function ErrorHandlingExample() {
  const [error, setError] = useState<string | null>(null);

  const testFileTooLarge = useCallback(() => {
    try {
      // This would normally be caught by validation
      const client = createAvatarClient({ domain: 'example.com' });
      // Simulate file too large error
      throw new Error('File too large. Max size for avatar: 2MB');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const testInvalidSignature = useCallback(() => {
    try {
      // Simulate invalid signature error
      throw new Error('Invalid signature provided');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Error Handling Examples</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={testFileTooLarge} style={{ padding: '10px 20px', marginRight: '10px' }}>
          Test File Too Large
        </button>
        <button onClick={testInvalidSignature} style={{ padding: '10px 20px' }}>
          Test Invalid Signature
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

// Example usage in a React app
export function AvatarSDKApp() {
  return (
    <div>
      <AvatarUploader />
      <hr style={{ margin: '40px 0' }} />
      <ManualAvatarUploader />
      <hr style={{ margin: '40px 0' }} />
      <ErrorHandlingExample />
    </div>
  );
}

export default AvatarSDKApp;

