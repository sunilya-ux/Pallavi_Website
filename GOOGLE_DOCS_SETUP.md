# Google Docs Export Setup (Optional)

The application now supports exporting AI-generated content directly to Google Docs. This feature is **optional** and requires Google OAuth configuration.

## Features Without Google OAuth

If Google OAuth is not configured, the "Export to Google Docs" button will:
- Show a message indicating the feature requires configuration
- Automatically download the content as a text file instead
- Users can still use the "Download as PDF" feature (no configuration required)

## Setting Up Google Docs Export

If you want to enable full Google Docs export functionality, follow these steps:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Docs API** for your project:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Docs API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen if prompted:
   - User Type: External
   - Add your app name and required information
   - Add the scope: `https://www.googleapis.com/auth/documents`
4. Choose "Web application" as the application type
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
6. Add authorized redirect URIs:
   - Same as JavaScript origins
7. Click "Create" and copy your **Client ID**

### 3. Add Client ID to Environment Variables

Add the Client ID to your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### 4. Restart Development Server

If running locally, restart your development server to load the new environment variable.

## How It Works

When configured:

1. User clicks "Export to Google Docs"
2. A popup window opens for Google authentication
3. User signs in and authorizes the app
4. The content is automatically created as a new Google Doc
5. The document opens in a new tab
6. A success message confirms the export

## Security Notes

- The Google access token is never stored
- Each export requires fresh authentication
- Only the Google Docs API scope is requested
- The app cannot access or modify other Google Drive files

## Troubleshooting

**"Google Docs export requires configuration"**
- The Google Client ID is not set in environment variables
- The app will fall back to downloading a text file

**Authentication popup blocked**
- Check your browser's popup blocker settings
- Allow popups for your application domain

**"Failed to export to Google Docs"**
- Verify the Google Docs API is enabled in your project
- Check that the Client ID is correct
- Ensure authorized domains match your current domain

## Alternative: PDF Export (Always Available)

The PDF export feature works without any configuration:
- Click "Download as PDF"
- Generates a properly formatted PDF with the AI content
- Preserves headings, paragraphs, and formatting
- Downloads directly to your device
