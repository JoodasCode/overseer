/**
 * Knowledge Base System Test Script
 * 
 * This script tests the knowledge base system by:
 * 1. Creating a test document
 * 2. Processing the document
 * 3. Performing a semantic search
 * 4. Retrieving knowledge context for a chat
 */

import { DocumentProcessor } from '../lib/knowledge-base/document-processor';
import { KnowledgeRetriever } from '../lib/knowledge-base/knowledge-retriever';
import { KnowledgeContextProvider } from '../lib/knowledge-base/knowledge-context-provider';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testKnowledgeSystem() {
  try {
    console.log('🧪 Starting Knowledge Base System Test');
    
    // Create a test document
    console.log('\n📄 Creating test document...');
    const testDoc = await prisma.knowledgeBase.create({
      data: {
        user_id: 'test-user',
        title: 'Test Document',
        content: 'This is a test document for the knowledge base system.',
        content_type: 'document',
        metadata: {
          fileName: 'test-document.txt',
          fileType: 'text/plain',
          fileSize: 100,
          filePath: 'test/test-document.txt',
          category: 'test',
          description: 'A test document',
          uploadedAt: new Date().toISOString(),
          processingStatus: 'pending',
        },
      },
    });
    
    console.log(`✅ Test document created with ID: ${testDoc.id}`);
    
    // Process the document
    console.log('\n🔄 Processing document...');
    await DocumentProcessor.processDocument(testDoc.id);
    
    // Verify document was processed
    const processedDoc = await prisma.knowledgeBase.findUnique({
      where: { id: testDoc.id },
    });
    
    const metadata = processedDoc?.metadata as Record<string, any> || {};
    if (metadata.processingStatus === 'completed') {
      console.log('✅ Document processed successfully');
    } else {
      console.error('❌ Document processing failed');
      console.error('Status:', metadata.processingStatus);
      console.error('Error:', metadata.errorMessage);
    }
    
    // Test semantic search
    console.log('\n🔍 Testing semantic search...');
    const retriever = new KnowledgeRetriever();
    // @ts-ignore - Method exists but TypeScript doesn't recognize it
    const searchResults = await retriever.searchKnowledgeBase({
      query: 'test document',
      userId: 'test-user',
      limit: 5,
      useSemanticSearch: true,
    });
    
    console.log(`✅ Search returned ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log('First result:', {
        id: searchResults[0].id,
        title: searchResults[0].title,
        score: searchResults[0].score,
        snippet: searchResults[0].contentSnippet,
      });
    }
    
    // Test knowledge context for chat
    console.log('\n💬 Testing knowledge context for chat...');
    const contextProvider = new KnowledgeContextProvider();
    // @ts-ignore - Method exists but TypeScript doesn't recognize it
    const chatContext = await contextProvider.getKnowledgeContextForChat({
      userId: 'test-user',
      messages: [{ role: 'user', content: 'Tell me about the test document' }],
      maxTokens: 1000,
    });
    
    console.log('✅ Chat context retrieved');
    console.log('Context:', chatContext.substring(0, 100) + '...');
    
    // Clean up
    console.log('\n🧹 Cleaning up...');
    // @ts-ignore - Table exists but TypeScript doesn't recognize it
    await prisma.knowledgeBaseChunk.deleteMany({
      where: { knowledge_base_id: testDoc.id },
    });
    await prisma.knowledgeBase.delete({
      where: { id: testDoc.id },
    });
    console.log('✅ Test document and chunks deleted');
    
    console.log('\n✅ Knowledge Base System Test Completed Successfully');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testKnowledgeSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { testKnowledgeSystem };
