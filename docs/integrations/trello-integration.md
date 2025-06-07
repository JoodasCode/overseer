# Trello Integration

This document describes how to set up and use the Trello integration with Overseer.

## Overview

The Trello adapter allows Overseer to interact with Trello boards, lists, and cards. It enables agents to create and update cards, fetch boards, lists, and cards from Trello.

## Setup

### 1. Create a Trello API Key

1. Log in to your Trello account
2. Visit [https://trello.com/app-key](https://trello.com/app-key)
3. Copy your API Key

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```
TRELLO_API_KEY=your_trello_api_key
TRELLO_API_SECRET=your_trello_api_secret
```

### 3. OAuth Setup

The Trello integration uses OAuth for authentication. When a user connects their Trello account, they will be redirected to Trello's authorization page. After authorizing, they will be redirected back to Overseer.

## Usage

### Connecting a Trello Account

1. Navigate to the Settings > Integrations page in Overseer
2. Click "Connect" next to the Trello integration
3. Follow the OAuth flow to authorize Overseer to access your Trello account

### Available Operations

The Trello adapter supports the following operations:

#### Send Operations

- **Create Card**
  ```typescript
  await pluginEngine.send('trello', {
    action: 'create_card',
    listId: 'list_id',
    name: 'Card Title',
    description: 'Card Description',
    // Optional parameters
    due: '2023-12-31T23:59:59Z', // ISO date string
    pos: 'top', // 'top', 'bottom', or a positive number
    labels: ['label_id_1', 'label_id_2'],
    members: ['member_id_1', 'member_id_2']
  });
  ```

- **Update Card**
  ```typescript
  await pluginEngine.send('trello', {
    action: 'update_card',
    cardId: 'card_id',
    // Optional parameters - include only what you want to update
    name: 'Updated Card Title',
    description: 'Updated Card Description',
    due: '2023-12-31T23:59:59Z',
    closed: false, // Set to true to archive the card
    idList: 'new_list_id' // Move card to a different list
  });
  ```

#### Fetch Operations

- **Get Boards**
  ```typescript
  const result = await pluginEngine.fetch('trello', {
    action: 'get_boards'
  });
  // result.data will contain an array of boards
  ```

- **Get Lists**
  ```typescript
  const result = await pluginEngine.fetch('trello', {
    action: 'get_lists',
    boardId: 'board_id'
  });
  // result.data will contain an array of lists
  ```

- **Get Cards**
  ```typescript
  const result = await pluginEngine.fetch('trello', {
    action: 'get_cards',
    listId: 'list_id'
  });
  // result.data will contain an array of cards
  ```

## Error Handling

The Trello adapter includes comprehensive error handling. All errors are logged through the Overseer error handling system and can be viewed in the admin dashboard.

## Troubleshooting

If you encounter issues with the Trello integration:

1. Check that your API key and secret are correctly configured
2. Ensure the user has authorized Overseer to access their Trello account
3. Verify that the user has the necessary permissions in Trello
4. Check the Overseer logs for detailed error messages

## Security Considerations

- The Trello API key and secret should be kept secure
- User tokens are stored encrypted in the database
- The integration only requests the minimum required permissions (read and write)
