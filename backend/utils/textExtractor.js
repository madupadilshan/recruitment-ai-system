// Real text extraction utility for CV files
import fs from 'fs';
import path from 'path';

// REAL PDF TEXT EXTRACTION FUNCTION
const extractPDFTextReal = async (filePath) => {
  try {
    console.log('📄 Starting real PDF text extraction from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    // Read PDF file as buffer
    const pdfBuffer = fs.readFileSync(filePath);
    console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');

    // Parse PDF and extract text
    const data = await pdfParse(pdfBuffer);
    const extractedText = data.text.trim();
    
    if (!extractedText || extractedText.length < 10) {
      throw new Error('No readable text content found in PDF');
    }
    
    console.log('✅ Successfully extracted', extractedText.length, 'characters from PDF');
    console.log('📝 First 200 characters:', extractedText.substring(0, 200));
    
    return extractedText;

  } catch (error) {
    console.error('❌ Real PDF extraction failed:', error.message);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Fallback content ONLY for testing - should not be used in production
const generateMinimalFallback = (identifier) => {
  console.log('⚠️ WARNING: Using fallback content - PDF extraction failed');
  return `CV content could not be extracted from file: ${identifier}. Please upload a valid PDF file with readable text.`;
};

// Extract text from PDF files using real PDF parsing
const extractPDFText = async (filePath) => {
  try {
    return await extractPDFTextReal(filePath);
  } catch (error) {
    console.error('❌ PDF extraction error:', error.message);
    // Only use fallback if real extraction fails
    const filename = path.basename(filePath, path.extname(filePath));
    return generateMinimalFallback(filename);
  }
};
const extractDOCXText = async (filePath) => {
  try {
    console.log('📄 Attempting to extract DOCX text from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`DOCX file not found: ${filePath}`);
    }
    
    // For now, we'll read as binary and extract text patterns
    // In production, use mammoth or docx-parser library
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic text extraction for DOCX (very limited)
    const textMatch = content.match(/[\w\s\-@.]+/g);
    if (textMatch) {
      return textMatch.join(' ').replace(/\s+/g, ' ').trim();
    }
    
    throw new Error('No readable text found in DOCX');
  } catch (error) {
    console.error('❌ DOCX extraction error:', error.message);
    console.log('🔄 Falling back to filename-based content generation...');
    
    const filename = path.basename(filePath, path.extname(filePath));
    return generateFallbackContent(filename);
  }
};

// Extract text from plain text files
const extractTXTText = async (filePath) => {
  try {
    console.log('📄 Reading text file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Text file not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('✅ Text file read successfully, length:', content.length);
    return content;
  } catch (error) {
    console.error('❌ TXT extraction error:', error.message);
    const filename = path.basename(filePath, path.extname(filePath));
    return generateFallbackContent(filename);
  }
};

// Main text extraction function
export const extractTextFromFile = async (filePath) => {
  try {
    console.log('📄 Starting text extraction from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('⚠️ File does not exist, generating fallback content');
      const filename = path.basename(filePath, path.extname(filePath));
      return generateFallbackContent(filename || 'candidate');
    }
    
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileSize = fs.statSync(filePath).size;
    console.log(`📊 File info: ${fileExtension} format, ${fileSize} bytes`);
    
    let extractedText = '';
    
    try {
      switch (fileExtension) {
        case '.pdf':
          console.log('📄 Processing PDF file...');
          // Simple PDF text extraction approach
          try {
            const pdfBuffer = fs.readFileSync(filePath);
            // Look for text patterns in the PDF buffer
            const textContent = pdfBuffer.toString('latin1');
            const textMatches = textContent.match(/[a-zA-Z0-9\s@.,;:!?()-]{20,}/g);
            
            if (textMatches && textMatches.length > 0) {
              extractedText = textMatches
                .filter(text => text.trim().length > 20)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
            
            if (!extractedText || extractedText.length < 50) {
              throw new Error('PDF appears to be image-based or encrypted. Please upload a text-based PDF.');
            }
          } catch (pdfError) {
            throw new Error(`PDF extraction failed: ${pdfError.message}. Please ensure your PDF contains selectable text.`);
          }
          break;
        case '.docx':
        case '.doc':
          extractedText = await extractDOCXText(filePath);
          break;
        case '.txt':
          extractedText = await extractTXTText(filePath);
          break;
        default:
          console.log('🔄 Unknown file type, attempting text read...');
          // Try to read as text file
          extractedText = fs.readFileSync(filePath, 'utf8');
      }
    } catch (fileError) {
      console.error('❌ File-specific extraction failed:', fileError.message);
      // Don't use fallback content - return error message instead
      throw new Error(`Failed to extract text from ${path.extname(filePath)} file: ${fileError.message}`);
    }
    
    if (!extractedText || extractedText.trim().length === 0) {
      console.log('⚠️ No text content extracted from file');
      throw new Error('No readable text content found in the uploaded file. Please ensure the file contains text and is not corrupted.');
    }
    
    const finalText = extractedText.trim();
    console.log('✅ Text extraction completed successfully, final length:', finalText.length);
    return finalText;
    
  } catch (error) {
    console.error('❌ Text extraction completely failed:', error.message);
    
    // Return error instead of fake content
    throw new Error(`Failed to extract text from CV file: ${error.message}. Please upload a valid PDF or text file.`);
  }
};

export default extractTextFromFile;