import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

// Initialize Supabase client for file storage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define error logging helper
const logError = (error: unknown, action: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  errorHandler.logError({
    tool: 'document-processor',
    action,
    errorCode: 'DOCUMENT_PROCESSING_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Document processor class for handling text extraction and embedding generation
 */
export class DocumentProcessor {
  /**
   * Process a document from the knowledge base
   * @param documentId The ID of the knowledge base document to process
   */
  public static async processDocument(documentId: string): Promise<boolean> {
    try {
      // Fetch document from database
      const document = await prisma.knowledgeBase.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      // Update document status to processing
      await prisma.knowledgeBase.update({
        where: { id: documentId },
        data: {
          metadata: {
            ...(document.metadata as Record<string, any> || {}),
            processingStatus: 'processing'
          }
        }
      });

      // Extract text from document
      const extractedText = await this.extractText(document);
      
      // Generate chunks for large documents
      const chunks = this.chunkText(extractedText);
      
      // Generate embeddings for each chunk
      const embeddings = await this.generateEmbeddings(chunks);
      
      // Store the extracted text and embeddings
      await prisma.knowledgeBase.update({
        where: { id: documentId },
        data: {
          content: extractedText,
          embedding: embeddings[0], // Store the embedding of the first chunk as the document embedding
          metadata: {
            ...(document.metadata as Record<string, any> || {}),
            processingStatus: 'completed',
            chunks: chunks.length,
            extractedAt: new Date().toISOString()
          }
        }
      });

      // For documents with multiple chunks, store them separately
      if (chunks.length > 1) {
        // Create a separate entry for each chunk with its embedding
        for (let i = 1; i < chunks.length; i++) {
          await prisma.knowledgeBase.create({
            data: {
              user_id: document.user_id,
              title: `${document.title} - Chunk ${i + 1}`,
              content: chunks[i],
              content_type: 'chunk',
              embedding: embeddings[i],
              metadata: {
                parentId: document.id,
                chunkIndex: i,
                totalChunks: chunks.length,
              }
            }
          });
        }
      }

      return true;
    } catch (error) {
      logError(error, 'processDocument');
      
      try {
        // Update document status to error
        await prisma.knowledgeBase.update({
          where: { id: documentId },
          data: {
            metadata: {
              processingStatus: 'error',
              errorMessage: error instanceof Error ? error.message : 'Unknown error during processing'
            }
          }
        });
      } catch (updateError) {
        logError(updateError, 'updateErrorStatus');
      }
      
      return false;
    }
  }

  /**
   * Extract text from a document based on its type
   * @param document The knowledge base document
   * @returns The extracted text
   */
  private static async extractText(document: any): Promise<string> {
    const metadata = document.metadata as any;
    const filePath = metadata.filePath;
    const fileType = metadata.fileType;

    if (!filePath) {
      throw new Error('Document has no file path');
    }

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Extract text based on file type
    let extractedText = '';

    switch (fileType) {
      case 'text/plain':
      case 'text/markdown':
      case 'text/csv':
      case 'application/json':
        // For text files, just read the content
        extractedText = await fileData.text();
        break;
        
      case 'application/pdf':
        // For PDFs, we would use a PDF parsing library
        // This is a placeholder - in a real implementation, you would use a library like pdf-parse
        extractedText = await this.extractTextFromPdf(fileData);
        break;
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For DOCX files, we would use a DOCX parsing library
        // This is a placeholder - in a real implementation, you would use a library like mammoth
        extractedText = await this.extractTextFromDocx(fileData);
        break;
        
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        // For XLSX files, we would use an XLSX parsing library
        // This is a placeholder - in a real implementation, you would use a library like xlsx
        extractedText = await this.extractTextFromXlsx(fileData);
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return extractedText;
  }

  /**
   * Extract text from a PDF file
   * @param fileData The PDF file data
   * @returns The extracted text
   */
  private static async extractTextFromPdf(fileData: Blob): Promise<string> {
    // In a real implementation, you would use a library like pdf-parse
    // For now, we'll just return a placeholder
    return 'PDF text extraction placeholder - implement with pdf-parse library';
  }

  /**
   * Extract text from a DOCX file
   * @param fileData The DOCX file data
   * @returns The extracted text
   */
  private static async extractTextFromDocx(fileData: Blob): Promise<string> {
    // In a real implementation, you would use a library like mammoth
    // For now, we'll just return a placeholder
    return 'DOCX text extraction placeholder - implement with mammoth library';
  }

  /**
   * Extract text from an XLSX file
   * @param fileData The XLSX file data
   * @returns The extracted text
   */
  private static async extractTextFromXlsx(fileData: Blob): Promise<string> {
    // In a real implementation, you would use a library like xlsx
    // For now, we'll just return a placeholder
    return 'XLSX text extraction placeholder - implement with xlsx library';
  }

  /**
   * Chunk text into smaller pieces for embedding
   * @param text The text to chunk
   * @param maxChunkSize The maximum size of each chunk (default: 1000 tokens)
   * @returns An array of text chunks
   */
  private static chunkText(text: string, maxChunkSize: number = 1000): string[] {
    // Simple chunking by splitting on paragraphs and combining until we reach the max chunk size
    // In a real implementation, you would use a more sophisticated chunking algorithm
    const paragraphs = text.split('\n\n');
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // Rough estimate: 1 token ≈ 4 characters
      const estimatedTokens = (currentChunk.length + paragraph.length) / 4;
      
      if (estimatedTokens > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }

  /**
   * Generate embeddings for text chunks
   * @param chunks Array of text chunks
   * @returns Array of embeddings
   */
  private static async generateEmbeddings(chunks: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const chunk of chunks) {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk,
        });
        
        const embedding = response.data[0].embedding;
        embeddings.push(embedding);
      } catch (error) {
        logError(error, 'generateEmbedding');
        // If embedding generation fails, push an empty array as a placeholder
        embeddings.push([]);
      }
    }
    
    return embeddings;
  }
}
