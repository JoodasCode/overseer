import { prisma } from '@/lib/prisma';
import { DocumentProcessor } from './document-processor';
import { ErrorHandler } from '@/lib/plugin-engine/error-handler';

// Initialize error handler
const errorHandler = ErrorHandler.getInstance();

// Define error logging helper
const logError = (error: unknown, action: string) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  errorHandler.logError({
    tool: 'job-processor',
    action,
    errorCode: 'JOB_PROCESSING_ERROR',
    errorMessage: errorMessage,
    agentId: 'system',
    userId: 'system',
    payload: { details: JSON.stringify(error) },
    timestamp: new Date().toISOString(),
    resolved: false
  }).catch(console.error);
};

/**
 * Job processor for handling background tasks
 */
export class JobProcessor {
  private static isRunning = false;
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * Start the job processor
   * @param intervalMs Interval in milliseconds between job processing runs
   */
  public static start(intervalMs: number = 60000): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processNextJob().catch(error => {
        logError(error, 'processNextJob');
      });
    }, intervalMs);

    console.log(`Job processor started with ${intervalMs}ms interval`);
  }

  /**
   * Stop the job processor
   */
  public static stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('Job processor stopped');
    }
  }

  /**
   * Process the next pending job
   */
  private static async processNextJob(): Promise<void> {
    // Prevent concurrent processing
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Find pending document processing jobs
      const pendingDocuments = await prisma.knowledgeBase.findMany({
        where: {
          content_type: 'document',
          metadata: {
            path: ['processingStatus'],
            equals: 'pending'
          }
        },
        take: 1, // Process one at a time
        orderBy: {
          created_at: 'asc' // Process oldest first
        }
      });

      if (pendingDocuments.length === 0) {
        // No pending jobs
        this.isRunning = false;
        return;
      }

      const document = pendingDocuments[0];
      console.log(`Processing document: ${document.id}`);

      // Process the document
      await DocumentProcessor.processDocument(document.id);

      console.log(`Document processed: ${document.id}`);
    } catch (error) {
      logError(error, 'processNextJob');
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Queue a document for processing
   * @param documentId The ID of the document to process
   */
  public static async queueDocument(documentId: string): Promise<void> {
    try {
      // Update document status to pending
      await prisma.knowledgeBase.update({
        where: { id: documentId },
        data: {
          metadata: {
            processingStatus: 'pending',
            queuedAt: new Date().toISOString()
          }
        }
      });

      console.log(`Document queued for processing: ${documentId}`);

      // Trigger immediate processing if not already running
      if (!this.isRunning) {
        this.processNextJob().catch(error => {
          logError(error, 'queueDocument');
        });
      }
    } catch (error) {
      logError(error, 'queueDocument');
    }
  }
}
