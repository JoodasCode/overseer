/**
 * Trello Adapter Tests
 * 
 * This file contains unit tests for the TrelloAdapter class.
 */

import { TrelloAdapter } from '../trello-adapter';
import { ErrorHandler } from '../../error-handler';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('../../error-handler');
jest.mock('../../integration-manager', () => ({
  IntegrationManager: jest.fn().mockImplementation(() => ({
    getIntegration: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      metadata: {
        apiKey: 'mock-api-key',
      },
    }),
  })),
}));

describe('TrelloAdapter', () => {
  let adapter: TrelloAdapter;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  
  beforeEach(() => {
    mockErrorHandler = new ErrorHandler() as jest.Mocked<ErrorHandler>;
    adapter = new TrelloAdapter(mockErrorHandler);
    
    // Reset axios mock
    (axios.get as jest.Mock).mockReset();
    (axios.post as jest.Mock).mockReset();
    (axios.put as jest.Mock).mockReset();
  });
  
  describe('connect', () => {
    it('should return connected status when integration exists', async () => {
      const result = await adapter.connect('user-123');
      
      expect(result).toEqual({
        connected: true,
        scopes: ['read', 'write'],
      });
    });
  });
  
  describe('send', () => {
    it('should create a card successfully', async () => {
      const mockCardData = { id: 'card-123', name: 'Test Card' };
      (axios.post as jest.Mock).mockResolvedValueOnce({ data: mockCardData });
      
      const result = await adapter.send('agent-123', {
        action: 'create_card',
        listId: 'list-123',
        name: 'Test Card',
        description: 'Test Description',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCardData);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/cards'),
        expect.any(Object),
        expect.any(Object)
      );
    });
    
    it('should update a card successfully', async () => {
      const mockCardData = { id: 'card-123', name: 'Updated Card' };
      (axios.put as jest.Mock).mockResolvedValueOnce({ data: mockCardData });
      
      const result = await adapter.send('agent-123', {
        action: 'update_card',
        cardId: 'card-123',
        name: 'Updated Card',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCardData);
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/cards/card-123'),
        expect.any(Object),
        expect.any(Object)
      );
    });
    
    it('should handle errors when sending data', async () => {
      const mockError = new Error('API Error');
      (axios.post as jest.Mock).mockRejectedValueOnce(mockError);
      
      const result = await adapter.send('agent-123', {
        action: 'create_card',
        listId: 'list-123',
        name: 'Test Card',
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to send data to Trello');
      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });
  });
  
  describe('fetch', () => {
    it('should fetch boards successfully', async () => {
      const mockBoards = [{ id: 'board-1', name: 'Board 1' }];
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockBoards });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_boards',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBoards);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/members/me/boards'),
        expect.any(Object)
      );
    });
    
    it('should fetch lists successfully', async () => {
      const mockLists = [{ id: 'list-1', name: 'List 1' }];
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockLists });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_lists',
        boardId: 'board-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockLists);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/boards/board-123/lists'),
        expect.any(Object)
      );
    });
    
    it('should fetch cards successfully', async () => {
      const mockCards = [{ id: 'card-1', name: 'Card 1' }];
      (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockCards });
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_cards',
        listId: 'list-123',
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCards);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/lists/list-123/cards'),
        expect.any(Object)
      );
    });
    
    it('should handle errors when fetching data', async () => {
      const mockError = new Error('API Error');
      (axios.get as jest.Mock).mockRejectedValueOnce(mockError);
      
      const result = await adapter.fetch('agent-123', {
        action: 'get_boards',
      });
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to fetch data from Trello');
      expect(mockErrorHandler.logError).toHaveBeenCalled();
    });
  });
  
  describe('isConnected', () => {
    it('should return true when integration exists', async () => {
      const result = await adapter.isConnected('user-123');
      expect(result).toBe(true);
    });
  });
  
  describe('getMetadata', () => {
    it('should return correct metadata', () => {
      const metadata = adapter.getMetadata();
      
      expect(metadata).toEqual({
        id: 'trello',
        name: 'Trello',
        description: 'Integrate with Trello boards, lists, and cards',
        version: '1.0.0',
        author: 'Overseer',
        scopes: ['read', 'write'],
        configSchema: {
          apiKey: {
            type: 'string',
            required: true,
            description: 'Trello API Key',
          },
          token: {
            type: 'string',
            required: true,
            description: 'Trello API Token',
          },
        },
      });
    });
  });
});
