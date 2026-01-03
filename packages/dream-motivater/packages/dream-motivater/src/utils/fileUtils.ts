/**
 * File Upload Utilities
 * Handles PDF text extraction and file validation
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain'];

/**
 * Validate uploaded file
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.txt')) {
    return {
      valid: false,
      error: 'Only PDF and TXT files are allowed',
    };
  }

  return { valid: true };
}

/**
 * Extract text from PDF file
 * Note: This is a simplified version. For production, use a library like pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // For now, we'll use a simple text extraction
        // In production, integrate pdf.js or similar library
        const text = await extractTextFromArrayBuffer(arrayBuffer);
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Extract text from file (auto-detect type)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else {
    return extractTextFromTXT(file);
  }
}

/**
 * Simple PDF text extraction from ArrayBuffer
 * This is a basic implementation - for production use pdf.js
 */
async function extractTextFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<string> {
  // Convert ArrayBuffer to string
  const uint8Array = new Uint8Array(arrayBuffer);
  let text = '';

  // Try to extract readable text from PDF
  // This is a very basic approach - PDF structure is complex
  for (let i = 0; i < uint8Array.length; i++) {
    const char = uint8Array[i];
    // Only include printable ASCII characters
    if (char >= 32 && char <= 126) {
      text += String.fromCharCode(char);
    } else if (char === 10 || char === 13) {
      text += '\n';
    }
  }

  // Clean up the text
  text = text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();

  if (text.length < 50) {
    throw new Error('Could not extract text from PDF. Please try a text-based PDF or use a TXT file.');
  }

  return text;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Download text as file
 */
export function downloadTextAsFile(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

