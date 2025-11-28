# Run and deploy your GenSuite Pro app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the root directory based on `.env.local.example`
3. Set the required environment variables in `.env.local`:
   - `VITE_FIREBASE_API_KEY` - Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
   - `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
   - `VITE_FIREBASE_APP_ID` - Your Firebase app ID
   - `VITE_GEMINI_API_KEY` - Your Gemini API key
4. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Push your code to a GitHub repository
2. Create a new project on Vercel and connect it to your GitHub repository
3. Set the environment variables in Vercel project settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GEMINI_API_KEY`
4. Deploy the project

Note: Never commit your `.env.local` file to version control as it contains sensitive information.