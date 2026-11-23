# Google sign-in setup

1. In Google Cloud Console, configure the OAuth consent screen and create an OAuth client ID of type **Web application**.
2. Add the app's browser origins under **Authorized JavaScript origins** (for local development, `http://localhost:5173`; add your deployed HTTPS origin in production).
3. Set `GOOGLE_CLIENT_ID` in `backend/.env` to that client ID, then restart the backend. Do not put a client secret in the frontend; this integration does not need one.
4. Start the frontend and backend. The Google button appears on the sign-in and account creation pages once the client ID is configured.

The backend verifies Google's signed ID token and only uses verified claims. Google identities are stored by their stable subject ID. Verified Gmail and Google Workspace addresses can link to an existing account with the same email; other existing accounts must first use password sign-in.

Google sign-in setup reference: https://developers.google.com/identity/gsi/web/guides/display-button
