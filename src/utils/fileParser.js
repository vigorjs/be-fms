const fs = require('fs');
const path = require('path');
const textract = require('textract');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class FileParser {
  static async extractText(filePath, mimeType) {
    try {
      // Handle plain text files
      if (mimeType.startsWith('text/')) {
        return fs.promises.readFile(filePath, 'utf-8');
      }

      // Handle PDF files
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
      }

      // Handle Word documents
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      }

      // Fallback to textract for other file types
      return new Promise((resolve, reject) => {
        textract.fromFileWithPath(filePath, (error, text) => {
          if (error) {
            console.error(`Error extracting text from ${filePath}:`, error);
            resolve(null); // Return null if extraction fails
          } else {
            resolve(text);
          }
        });
      });
    } catch (error) {
      console.error('Error in text extraction:', error);
      return null;
    }
  }
}

module.exports = FileParser;