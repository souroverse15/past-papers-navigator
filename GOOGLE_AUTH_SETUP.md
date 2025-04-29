# Google Authentication Setup Guide

Follow these steps to set up Google Authentication for your Past Papers Navigator app:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a name for your project (e.g., "Past Papers Navigator")
5. Click "Create"

## 2. Configure the OAuth Consent Screen

1. In your new project, go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you're restricting to a specific organization)
3. Click "Create"
4. Fill in the required fields:
   - App name: "Past Papers Navigator"
   - User support email: Your email
   - Developer contact information: Your email
5. Click "Save and Continue"
6. Skip adding scopes for now and click "Save and Continue"
7. Skip adding test users if you're still in testing
8. Click "Save and Continue" and "Back to Dashboard"

## 3. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Name it "Past Papers Web Client"
5. Add Authorized JavaScript origins:
   - `http://localhost:5173` (for Vite development)
   - Your production URL if you have one
6. Add Authorized redirect URIs:
   - `http://localhost:5173`
   - Your production URL if you have one
7. Click "Create"
8. A modal will display your Client ID and Client Secret
9. Copy your Client ID

## 4. Add the Client ID to Your App

1. Open the `.env` file in your project
2. Replace `your-google-client-id.apps.googleusercontent.com` with your actual Client ID
3. Save the file

## 5. Start Your App

1. Run `npm run dev` to start your development server
2. The Google authentication should now be working

## Troubleshooting

If you encounter issues:

1. Make sure your Client ID is correctly set in the `.env` file
2. Ensure you've added `http://localhost:5173` as an authorized JavaScript origin
3. Check that popup blockers aren't preventing the Google sign-in window from opening
4. Clear your browser cache and try again

---

Your Google authentication now provides:

- User login/logout
- Protection for premium features
- Public access to past papers without login
