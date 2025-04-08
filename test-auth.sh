#!/bin/bash

echo "🔍 Authentication Test Script 🔍"
echo "==============================="
echo ""
echo "This script will guide you through testing the authentication system."
echo ""

echo "Step 1: Stop any running Next.js server"
echo "Press Enter after you've stopped the server..."
read

echo "Step 2: Clear browser data"
echo "- Open Chrome/Firefox/Safari"
echo "- Clear all cookies, cache, and storage for localhost"
echo "- Open a new Incognito/Private window"
echo "Press Enter when ready..."
read

echo "Step 3: Start the development server"
echo "Run: pnpm run dev:stable"
echo "Press Enter when the server is running..."
read

echo "Step 4: Login Test"
echo "- Navigate to http://localhost:3000/auth or /login"
echo "- Login with valid credentials"
echo "- Verify you're redirected to /dashboard"
echo "Press Enter when completed..."
read

echo "Step 5: Route Protection Test"
echo "- Open a new tab in the same window"
echo "- Try to access http://localhost:3000/auth directly"
echo "- Verify you're automatically redirected to /dashboard"
echo "Did the redirect work? (yes/no)"
read REDIRECT_RESULT

echo "Step 6: Sign Out Test"
echo "- Go back to http://localhost:3000/dashboard"
echo "- Click Sign Out"
echo "- Verify you're redirected to /auth"
echo "- Try to access http://localhost:3000/dashboard again"
echo "- Verify you cannot access the dashboard and are redirected to /auth"
echo "Did the sign out and redirection work? (yes/no)"
read SIGNOUT_RESULT

echo "Step 7: Check Terminal Logs"
echo "- Review the terminal logs for middleware messages"
echo "- Look for [timestamp] Session validation: Valid/Invalid messages"
echo "- Confirm middleware is preventing dashboard access after logout"
echo "- Confirm middleware is redirecting to dashboard when accessing auth pages while logged in"
echo "Do the logs confirm correct middleware behavior? (yes/no)"
read LOGS_RESULT

echo ""
echo "Test Results:"
echo "-------------"
echo "Route Protection: $REDIRECT_RESULT"
echo "Sign Out Flow: $SIGNOUT_RESULT" 
echo "Middleware Logs: $LOGS_RESULT"

if [[ "$REDIRECT_RESULT" == "yes" && "$SIGNOUT_RESULT" == "yes" && "$LOGS_RESULT" == "yes" ]]; then
  echo ""
  echo "✅ All tests PASSED! Authentication is working correctly."
else 
  echo ""
  echo "❌ Some tests FAILED. Review the specific failures above."
fi 