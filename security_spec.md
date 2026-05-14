# Security Specification for Final Eagle Eye 2.0

## Data Invariants
1. A `User` document can only be created/modified by the authenticated user with the matching `userId`.
2. An `Analysis` document MUST belong to a valid user and can only be accessed/modified by its owner.
3. `Analysis` tool types must be from a predefined set.
4. Timestamps (`createdAt`, `updatedAt`) must be server-generated.

## The "Dirty Dozen" Payloads (Attacks)
1. **Identity Spoofing**: Attempting to create a user profile for a different UID.
2. **Access Escalation**: Attempting to read another user's analysis report.
3. **Ghost Writes**: Attempting to update the `userId` of an existing analysis.
4. **Keyword Poisoning**: Injecting massive (1MB+) strings into keyword fields.
5. **Role Injection**: Attempting to set an `isAdmin` field in a user profile (system doesn't use it, but good to block).
6. **State Bypassing**: Updating `createdAt` manually.
7. **Cross-User Update**: Attempting to change the content of another user's analysis.
8. **Invalid Tool Type**: Setting a tool type like `delete_all_data`.
9. **Path Poisoning**: Using `/analyses/../../admins/123` as an ID.
10. **Shadow Field Injection**: Adding `is_free: true` to an analysis to bypass imaginary billing.
11. **Email Spoofing**: Creating a profile with an unverified email (if verified required).
12. **Orphaned Write**: Creating an analysis for a non-existent user.

## The Test Runner (firestore.rules.test.ts)
(Logic for testing these will be incorporated into the rules logic and verification)
