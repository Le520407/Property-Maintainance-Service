# Google OAuth Setup Guide

## Current Status
❌ **Error:** `The given client ID is not found` (403 error)
✅ **Fixed:** Duplicate environment variables removed
✅ **Fixed:** Enhanced error handling added

## Fix Required: Google Console Configuration

### Step 1: Access Google Cloud Console
1. Go to https://console.cloud.google.com/
2. Select your project or create a new one named "Property Maintenance Service"

### Step 2: Enable Required APIs
1. Navigate to "APIs & Services" → "Library"
2. Enable these APIs:
   - Google+ API
   - Google OAuth2 API
   - Google Identity Services API

### Step 3: Configure OAuth 2.0 Client
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Name: "Property Maintenance Service - Development"

### Step 4: Configure Authorized Origins
Add these URLs to "Authorized JavaScript origins":
```
http://localhost:3000
https://localhost:3000
http://127.0.0.1:3000
```

### Step 5: Configure Redirect URIs
Add these URLs to "Authorized redirect URIs":
```
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/auth/google/callback
```

### Step 6: Update Environment Variables
Once you get the new Client ID, update `.env`:

```properties
REACT_APP_GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
```

And update `backend/.env`:
```properties
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
```

### Step 7: Restart Servers
After updating environment variables:
```bash
# Frontend
npm start

# Backend (in separate terminal)
cd backend && npm start
```

## Testing the Fix
1. Open http://localhost:3000
2. Go to login page
3. Click "Continue with Google"
4. Should see Google OAuth popup (no 403 error)

## Troubleshooting
- **Still getting 403?** Check if all origins are added correctly
- **Client ID not found?** Verify the Client ID is copied correctly
- **Console errors?** Check browser developer tools for detailed errors

## Security Notes
- Never commit real Client IDs/Secrets to version control
- Use environment variables for all sensitive data
- Consider using different Client IDs for development/production