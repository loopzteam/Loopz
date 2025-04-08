# Authentication System Testing Protocol

This document outlines the testing protocol for verifying the authentication system in the Loopz application.

## Prerequisites
- A clean browser environment (cleared cache, cookies, and local storage)
- The application running with `pnpm run dev:stable`
- Developer tools open to monitor network requests and console logs

## Test Cases

### 1. Basic Authentication Flow

#### 1.1 Sign Up
1. Navigate to `/auth?mode=signup`
2. Complete the sign-up form with valid credentials
3. Verify redirection to `/dashboard`
4. Check console for successful middleware logs: `Session validation: Valid`

#### 1.2 Sign In
1. Sign out (if currently signed in)
2. Navigate to `/auth` or `/login`
3. Complete the sign-in form with valid credentials
4. Verify redirection to `/dashboard`
5. Check console for successful middleware logs
6. Verify in the Network tab that authentication cookies are set

#### 1.3 Sign Out
1. Ensure you're signed in and on the dashboard
2. Click the "Sign Out" button
3. Verify redirection to `/auth`
4. Check console for middleware logs showing session invalidation
5. Verify in the Application tab that authentication cookies are cleared
6. Try to navigate directly to `/dashboard`
7. Verify redirection back to `/auth`

### 2. Route Protection

#### 2.1 Protected Routes Access
1. Sign out completely
2. Try to access `/dashboard` directly
3. Verify immediate redirection to `/auth`
4. Check console for middleware logs: `Session check: Not found` and `Redirecting to /auth`

#### 2.2 Auth Routes When Authenticated
1. Sign in successfully
2. Try to access `/auth` or `/login` directly
3. Verify redirection to `/dashboard`
4. Check console for middleware logs: `Redirecting to /dashboard (auth route, valid session)`

### 3. Session Persistence & Invalidation

#### 3.1 Session Persistence
1. Sign in successfully
2. Close the browser tab
3. Open a new tab and navigate to the application URL
4. Try to access `/dashboard` directly
5. Verify you can access the dashboard without signing in again
6. Check console for middleware logs confirming valid session

#### 3.2 Session Invalidation
1. Sign in successfully
2. Access the dashboard
3. In another tab, navigate to `/api/auth-debug`
4. Verify cookies are present in the response
5. Sign out using the "Sign Out" button
6. In another tab, navigate to `/api/auth-debug` again
7. Verify no authentication cookies are present
8. Try to access `/dashboard`
9. Verify redirection to `/auth`

### 4. Edge Cases

#### 4.1 Expired Token Handling
1. Sign in successfully
2. Manually modify the token expiry in DevTools to be in the past
3. Try to access `/dashboard`
4. Verify redirection to `/auth`
5. Check console for middleware logs showing invalid session

#### 4.2 Invalid Token Handling
1. Sign in successfully
2. Manually corrupt the token value in DevTools
3. Try to access `/dashboard`
4. Verify redirection to `/auth`
5. Check console for middleware logs showing invalid session

#### 4.3 Multiple Tabs
1. Sign in in tab A
2. Open the dashboard in tab B
3. Sign out in tab A
4. Refresh tab B
5. Verify redirection to `/auth` in tab B

### 5. Error Handling

#### 5.1 Network Error During Authentication
1. Enable network throttling or offline mode in DevTools
2. Attempt to sign in
3. Verify appropriate error message is displayed
4. Verify user remains on auth page

## Reporting Issues

When reporting authentication issues, please include:
1. Exact steps to reproduce
2. Browser console logs
3. Network request logs for auth-related endpoints
4. Screenshots of the Application tab showing cookies before and after the issue
5. Browser and OS information 