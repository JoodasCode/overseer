# Asana Integration

This document describes how to set up and use the Asana integration with Overseer.

## Overview

The Asana adapter allows Overseer to interact with Asana workspaces, projects, and tasks. It enables agents to create, update, and delete tasks, as well as fetch workspaces, projects, and tasks from Asana.

## Setup

### 1. Create an Asana OAuth App

1. Log in to your Asana account
2. Visit [https://app.asana.com/0/developer-console](https://app.asana.com/0/developer-console)
3. Click "Create new application"
4. Fill in the required information:
   - App Name: Overseer
   - App URL: Your application URL
   - Redirect URL: `{YOUR_APP_URL}/api/plugin-engine/oauth/callback/asana`
5. Copy your Client ID and Client Secret

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```
ASANA_CLIENT_ID=your_asana_client_id
ASANA_CLIENT_SECRET=your_asana_client_secret
```

### 3. OAuth Setup

The Asana integration uses OAuth 2.0 for authentication. When a user connects their Asana account, they will be redirected to Asana's authorization page. After authorizing, they will be redirected back to Overseer.

## Usage

### Connecting an Asana Account

1. Navigate to the Settings > Integrations page in Overseer
2. Click "Connect" next to the Asana integration
3. Follow the OAuth flow to authorize Overseer to access your Asana account

### Available Operations

The Asana adapter supports the following operations:

#### Send Operations

- **Create Task**
  ```typescript
  await pluginEngine.send('asana', {
    action: 'create_task',
    name: 'Task Title',
    notes: 'Task Description',
    workspace: 'workspace_gid',
    // Optional parameters
    due_on: '2023-12-31', // YYYY-MM-DD format
    assignee: 'user_gid',
    projects: ['project_gid_1', 'project_gid_2']
  });
  ```

- **Update Task**
  ```typescript
  await pluginEngine.send('asana', {
    action: 'update_task',
    taskId: 'task_gid',
    // Optional parameters - include only what you want to update
    name: 'Updated Task Title',
    notes: 'Updated Task Description',
    due_on: '2023-12-31',
    completed: false,
    assignee: 'user_gid'
  });
  ```

- **Delete Task**
  ```typescript
  await pluginEngine.send('asana', {
    action: 'delete_task',
    taskId: 'task_gid'
  });
  ```

#### Fetch Operations

- **Get Workspaces**
  ```typescript
  const result = await pluginEngine.fetch('asana', {
    action: 'get_workspaces'
  });
  // result.data will contain an array of workspaces
  ```

- **Get Projects**
  ```typescript
  const result = await pluginEngine.fetch('asana', {
    action: 'get_projects',
    workspace: 'workspace_gid' // Optional, if not provided will fetch all accessible projects
  });
  // result.data will contain an array of projects
  ```

- **Get Tasks**
  ```typescript
  const result = await pluginEngine.fetch('asana', {
    action: 'get_tasks',
    project: 'project_gid' // You can also use assignee, workspace, or completed parameters
  });
  // result.data will contain an array of tasks
  ```

- **Get Task**
  ```typescript
  const result = await pluginEngine.fetch('asana', {
    action: 'get_task',
    taskId: 'task_gid'
  });
  // result.data will contain a single task
  ```

## Error Handling

The Asana adapter includes comprehensive error handling. All errors are logged to the Overseer error logging system with the following information:

- Error message
- HTTP status code (if applicable)
- Request details
- Timestamp

Common errors include:

- Authentication errors (401): Check that your OAuth tokens are valid
- Permission errors (403): Ensure the user has the necessary permissions in Asana
- Rate limiting (429): The adapter will automatically retry with exponential backoff
- Resource not found (404): Verify that the IDs used in requests are correct

## Pagination

The Asana adapter handles pagination automatically for list operations. When fetching large collections of data, the adapter will make multiple requests to retrieve all pages.

## Troubleshooting

### Connection Issues

If you're having trouble connecting to Asana:

1. Verify that your environment variables are correctly set
2. Check that your OAuth redirect URI matches exactly what's configured in your Asana app
3. Ensure the user has granted all necessary permissions during the OAuth flow

### API Errors

If you're receiving API errors:

1. Check the Overseer error logs for detailed information
2. Verify that the resource IDs (workspace, project, task) are correct
3. Ensure the user has the necessary permissions in Asana

## Security Considerations

- OAuth tokens are stored securely in the database
- Tokens are refreshed automatically when they expire
- All API requests are made over HTTPS
- Sensitive data is never logged

## Resources

- [Asana API Documentation](https://developers.asana.com/docs)
- [Asana OAuth Documentation](https://developers.asana.com/docs/oauth)
