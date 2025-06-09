/**
 * File Processor for Knowledge Base Integration
 * 
 * Processes uploaded files and integrates them with the knowledge base system.
 * Connects Supabase Storage with vector embeddings for semantic search.
 * Following Airbnb Style Guide for code formatting.
 */

import { getStorageService } from '@/lib/storage';
import { KnowledgeRetriever } from './knowledge-retriever';
import { ErrorHandler } from '@/lib/error-handler';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize services
const storageService = getStorageService();
const errorHandler = new ErrorHandler();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface FileProcessingResult {
  success: boolean;
  knowledgeBaseId?: string;
  fileMetadata?: any;
  extractedContent?: string;
  embedding?: number[];
  error?: string;
}

export interface FileProcessingOptions {
  category?: string;
  description?: string;
  isPublic?: boolean;
  extractText?: boolean;
  generateEmbedding?: boolean;
  agentId?: string;
}

/**
 * File Processor for Knowledge Base Integration
 */
export class FileProcessor {
  /**
   * Process uploaded file and add to knowledge base
   * 
   * @param file - File buffer to process
   * @param fileName - Name of the file
   * @param mimeType - MIME type of the file
   * @param userId - User ID who owns the file
   * @param options - Processing options
   * @returns Processing result with knowledge base entry
   */
  static async processFileForKnowledgeBase(
    file: Buffer,
    fileName: string,
    mimeType: string,
    userId: string,
    options: FileProcessingOptions = {}
  ): Promise<FileProcessingResult> {
    try {
      // 1. Upload file to appropriate storage bucket
      const bucket = this.selectBucket(mimeType, options);
      const fileMetadata = await storageService.uploadFile(
        file,
        fileName,
        mimeType,
        userId,
        {
          isPublic: options.isPublic || false,
          metadata: {
            category: options.category || 'knowledge-base',
            description: options.description,
            agentId: options.agentId,
            processedForKnowledge: true,
          },
        }
      );

      // 2. Extract text content from file
      let extractedContent = '';
      if (options.extractText !== false) {
        extractedContent = await this.extractTextFromFile(file, mimeType, fileName);
      }

      // 3. Generate embedding for semantic search
      let embedding: number[] = [];
      if (options.generateEmbedding !== false && extractedContent) {
        embedding = await this.generateEmbedding(extractedContent);
      }

      // 4. Create knowledge base entry
      const knowledgeEntry = await supabase
        .from('KnowledgeBase')
        .insert({
          user_id: userId,
          title: options.description || fileName,
          content: extractedContent,
          content_type: this.determineContentType(mimeType),
          embedding: embedding,
          metadata: {
            fileId: fileMetadata.id,
            fileName: fileName,
            mimeType: mimeType,
            fileSize: file.length,
            bucket: bucket,
            filePath: fileMetadata.path,
            category: options.category || 'document',
            agentId: options.agentId,
            processingStatus: 'completed',
            processedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (knowledgeEntry.error) {
        throw new Error(`Failed to create knowledge base entry: ${knowledgeEntry.error.message}`);
      }

      // 5. Update file metadata to link to knowledge base
      await supabase
        .from('File')
        .update({
          metadata: {
            ...fileMetadata.metadata,
            knowledgeBaseId: knowledgeEntry.data.id,
            linkedToKnowledge: true,
          },
        })
        .eq('id', fileMetadata.id);

      return {
        success: true,
        knowledgeBaseId: knowledgeEntry.data.id,
        fileMetadata,
        extractedContent,
        embedding,
      };
    } catch (error) {
      console.error('Error processing file for knowledge base:', error);
      errorHandler.logError(error as Error, 'FileProcessor.processFileForKnowledgeBase');

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Process existing file for knowledge base
   * 
   * @param fileId - ID of existing file in storage
   * @param userId - User ID who owns the file
   * @param options - Processing options
   * @returns Processing result
   */
  static async processExistingFile(
    fileId: string,
    userId: string,
    options: FileProcessingOptions = {}
  ): Promise<FileProcessingResult> {
    try {
      // Get file from storage
      const { buffer, metadata: fileMetadata } = await storageService.getFile(fileId, userId);
      
      return this.processFileForKnowledgeBase(
        buffer,
        fileMetadata.name,
        fileMetadata.mimeType,
        userId,
        options
      );
    } catch (error) {
      console.error('Error processing existing file:', error);
      errorHandler.logError(error as Error, 'FileProcessor.processExistingFile');

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Extract text content from file based on MIME type
   * 
   * @param file - File buffer
   * @param mimeType - MIME type of the file
   * @param fileName - Name of the file
   * @returns Extracted text content
   */
  private static async extractTextFromFile(
    file: Buffer,
    mimeType: string,
    fileName: string
  ): Promise<string> {
    try {
      switch (true) {
        case mimeType.includes('text/'):
          return file.toString('utf-8');

        case mimeType.includes('application/json'):
          return this.extractFromJSON(file);

        case mimeType.includes('text/csv'):
        case mimeType.includes('application/csv'):
          return this.extractFromCSV(file);

        case mimeType.includes('application/pdf'):
          // For PDF processing, you'd typically use a library like pdf-parse
          // For now, return a placeholder
          return `PDF document: ${fileName}\nContent extraction requires PDF processing library`;

        case mimeType.includes('application/msword'):
        case mimeType.includes('application/vnd.openxmlformats-officedocument'):
          // For Office documents, you'd use libraries like mammoth or docx
          return `Office document: ${fileName}\nContent extraction requires document processing library`;

        case mimeType.includes('image/'):
          // For images, you'd use OCR libraries like Tesseract
          return `Image file: ${fileName}\nText extraction requires OCR processing`;

        default:
          return `File: ${fileName}\nMIME type: ${mimeType}\nBinary content - no text extraction available`;
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      return `Error extracting text from ${fileName}: ${(error as Error).message}`;
    }
  }

  /**
   * Extract meaningful content from JSON files
   */
  private static extractFromJSON(file: Buffer): string {
    try {
      const jsonData = JSON.parse(file.toString('utf-8'));
      
      // Create a readable representation of the JSON
      const extractKeys = (obj: any, prefix = ''): string[] => {
        const lines: string[] = [];
        
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            lines.push(`${fullKey}:`);
            lines.push(...extractKeys(value, fullKey));
          } else {
            lines.push(`${fullKey}: ${String(value)}`);
          }
        }
        
        return lines;
      };
      
      return extractKeys(jsonData).join('\n');
    } catch (error) {
      return `JSON parsing error: ${(error as Error).message}`;
    }
  }

  /**
   * Extract content from CSV files
   */
  private static extractFromCSV(file: Buffer): string {
    try {
      const csvContent = file.toString('utf-8');
      const lines = csvContent.split('\n').slice(0, 100); // Limit to first 100 lines
      
      return lines.map((line, index) => {
        if (index === 0) {
          return `Headers: ${line}`;
        }
        return `Row ${index}: ${line}`;
      }).join('\n');
    } catch (error) {
      return `CSV parsing error: ${(error as Error).message}`;
    }
  }

  /**
   * Generate embedding for text content
   */
  private static async generateEmbedding(content: string): Promise<number[]> {
    try {
      // Truncate content if too long for OpenAI API
      const truncatedContent = content.length > 8000 
        ? content.substring(0, 8000) + '...'
        : content;

      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: truncatedContent,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return [];
    }
  }

  /**
   * Select appropriate storage bucket based on file type and options
   */
  private static selectBucket(mimeType: string, options: FileProcessingOptions): string {
    if (options.agentId) {
      return 'agent-assets';
    }
    
    if (options.isPublic) {
      return 'public-files';
    }
    
    // Default to user-uploads for knowledge base files
    return 'user-uploads';
  }

  /**
   * Determine content type for knowledge base
   */
  private static determineContentType(mimeType: string): string {
    switch (true) {
      case mimeType.includes('text/'):
        return 'text';
      case mimeType.includes('application/json'):
        return 'json';
      case mimeType.includes('csv'):
        return 'csv';
      case mimeType.includes('pdf'):
        return 'pdf';
      case mimeType.includes('image/'):
        return 'image';
      case mimeType.includes('application/msword'):
      case mimeType.includes('application/vnd.openxmlformats'):
        return 'document';
      default:
        return 'file';
    }
  }

  /**
   * Get knowledge base entries for a specific file
   * 
   * @param fileId - File ID
   * @param userId - User ID
   * @returns Knowledge base entries linked to the file
   */
  static async getKnowledgeBaseForFile(fileId: string, userId: string) {
    try {
      const { data: entries, error } = await supabase
        .from('KnowledgeBase')
        .select('*')
        .eq('user_id', userId)
        .contains('metadata', { fileId });

      if (error) {
        throw new Error(`Failed to get knowledge base entries: ${error.message}`);
      }

      return entries || [];
    } catch (error) {
      console.error('Error getting knowledge base for file:', error);
      return [];
    }
  }

  /**
   * Remove file from knowledge base (but keep in storage)
   * 
   * @param fileId - File ID
   * @param userId - User ID
   * @returns Success status
   */
  static async removeFromKnowledgeBase(fileId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('KnowledgeBase')
        .delete()
        .eq('user_id', userId)
        .contains('metadata', { fileId });

      if (error) {
        throw new Error(`Failed to remove from knowledge base: ${error.message}`);
      }

      // Update file metadata
      await supabase
        .from('File')
        .update({
          metadata: {
            linkedToKnowledge: false,
            removedFromKnowledge: new Date().toISOString(),
          },
        })
        .eq('id', fileId)
        .eq('ownerId', userId);

      return true;
    } catch (error) {
      console.error('Error removing from knowledge base:', error);
      return false;
    }
  }
} 