/**
 * File Upload and Processing Utilities
 */

export interface ParsedDocument {
  text: string;
  type: 'resume' | 'roadmap';
  metadata?: {
    fileName: string;
    fileSize: number;
    uploadDate: string;
  };
}

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // For now, return a placeholder
  // In production, use pdf.js or similar library
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      // This is a simplified version - in production use proper PDF parsing
      resolve(`[PDF Content from ${file.name}]\nThis is placeholder text. In production, use pdf.js to extract actual PDF content.`);
    };
    reader.readAsText(file);
  });
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Parse uploaded document
 */
export async function parseDocument(
  file: File,
  type: 'resume' | 'roadmap'
): Promise<ParsedDocument> {
  let text = '';

  if (file.type === 'application/pdf') {
    text = await extractTextFromPDF(file);
  } else if (file.type === 'text/plain') {
    text = await extractTextFromTXT(file);
  } else {
    throw new Error('Unsupported file type. Please upload PDF or TXT files.');
  }

  return {
    text,
    type,
    metadata: {
      fileName: file.name,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
    },
  };
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['application/pdf', 'text/plain'];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF and TXT files are supported' };
  }

  return { valid: true };
}

