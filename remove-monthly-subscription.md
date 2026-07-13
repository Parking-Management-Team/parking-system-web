# Remove Monthly Subscription Plan

## Goal
Pull the latest code from the `main` branch and completely remove monthly subscription UI components, screens, and API calls from both Manager and Admin interfaces.

## Tasks
- [x] Task 1: Pull the latest changes from the `main` branch → Verify: Run `git status` and check active branch and remote sync.
- [x] Task 2: Search and locate all occurrences of monthly subscription in the code → Verify: Grep for 'monthly', 'subscription' to list target files.
- [x] Task 3: Remove monthly subscription screens/components/options from the Manager dashboard → Verify: Verify Manager screens no longer reference monthly subscription UI.
- [x] Task 4: Remove monthly subscription screens/components/options from the Admin dashboard → Verify: Verify Admin screens no longer reference monthly subscription UI.
- [x] Task 5: Remove API calls, hooks, and services related to monthly subscriptions → Verify: Verify frontend no longer calls backend monthly subscription endpoints.
- [x] Task 6: Run verification check (linting, build verification) → Verify: Run lint and typescript check to ensure no broken imports or type errors.

## Done When
- [x] Code is updated from `main` branch.
- [x] All monthly subscription UI elements are removed from manager and admin interfaces.
- [x] All associated API calls for monthly subscription are deleted/cleaned up.
- [x] Project compiles and passes basic checks successfully.
