# Supabase Security Configuration

This document outlines manual security configurations that must be set in the Supabase Dashboard. These settings cannot be configured via SQL migrations.

## Required Manual Configurations

### 1. Auth Database Connection Strategy

**Status**: ⚠️ Requires Manual Configuration

**Issue**: Your Auth server is configured to use a fixed number of connections (10), which doesn't scale with instance upgrades.

**Solution**:
1. Open your Supabase Dashboard
2. Navigate to: **Project Settings** → **Database** → **Connection Pooling**
3. Locate the **Auth Connection Pool** settings
4. Change from **Fixed** to **Percentage-based** allocation
5. Set an appropriate percentage (recommended: 10-20% depending on your usage patterns)

**Why This Matters**: Using a percentage-based strategy ensures that when you upgrade your database instance, the Auth server automatically gets more connections, improving performance and reliability during traffic spikes.

---

### 2. Leaked Password Protection

**Status**: ⚠️ Requires Manual Configuration

**Issue**: Password breach detection is currently disabled, allowing users to set compromised passwords.

**Solution**:
1. Open your Supabase Dashboard
2. Navigate to: **Authentication** → **Providers** → **Email**
3. Scroll to the **Password Settings** section
4. Enable **"Password breach detection"** or **"Check against HaveIBeenPwned"**
5. Save your changes

**Why This Matters**: This feature checks new passwords against the HaveIBeenPwned.org database of billions of compromised passwords. It prevents users from setting passwords that have been exposed in data breaches, significantly improving account security.

**Note**: This feature works automatically without requiring any API keys and has minimal performance impact.

---

## Completed Fixes (Applied via Migration)

The following security and performance issues have been automatically fixed via database migration:

### ✅ Performance Optimizations

1. **Indexed Foreign Key**: Added index on `passion_coaching_responses.client_id`
   - Improves JOIN query performance
   - Reduces query execution time for client-related lookups

2. **Removed Unused Index**: Dropped `idx_clients_status`
   - Reduces storage overhead
   - Improves write performance on clients table

### ✅ RLS Policy Performance

3. **Optimized Auth Function Calls**: Updated all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
   - Changed from O(n) to O(1) evaluation
   - Significantly improves query performance at scale
   - Affects all policies across `profiles` and `clients` tables

4. **Eliminated current_setting() Per-Row Evaluation**: Split consolidated SELECT policy into role-specific policies
   - Removed `current_setting('role')` check that evaluated per-row
   - Created separate policies for `anon` and `authenticated` roles
   - PostgreSQL can now optimize policy evaluation at query planning time

---

## Informational Notices

### "Unused Index" Warning

**Notice**: Supabase may report that `idx_passion_coaching_responses_client_id` is unused.

**Why This Is Safe to Ignore**:
1. **Foreign Key Best Practice**: Indexing foreign key columns is a database best practice, even if usage statistics haven't accumulated yet
2. **Future Performance**: The index will be used whenever:
   - Queries JOIN between `passion_coaching_responses` and `clients` tables
   - Queries filter responses by `client_id`
   - The database enforces foreign key constraints during deletes
3. **Low Overhead**: The index has minimal storage overhead and improves write consistency
4. **Early Stage**: The warning may appear simply because there haven't been enough queries yet to register in PostgreSQL statistics

**Recommendation**: Keep this index. It will provide performance benefits as the application scales and query patterns develop.

### "Multiple Permissive Policies" Notice

**Notice**: Supabase may flag the `clients` table as having multiple permissive SELECT policies.

**Why This Is Correct**:
- Having separate policies for different roles (`anon` vs `authenticated`) is the performant approach
- The alternative (single consolidated policy) would require runtime role checking per-row
- This architecture allows PostgreSQL to optimize policy evaluation at query planning time
- This is the recommended pattern for handling different access patterns by role

---

## Security Considerations

### Client Authentication Architecture

**Current Implementation**: The application uses a custom `clients` table with password storage and client-side credential verification. The RLS policy allows unauthenticated (anon) users to read from the clients table for login verification.

**Security Note**: While this approach works, it has the following considerations:

1. **Data Exposure**: All client records are readable by unauthenticated users (though passwords are hashed)
2. **Client-Side Logic**: Authentication logic runs in the browser, which is less secure than server-side verification

**Recommended Future Enhancement**: Consider migrating to one of these more secure approaches:

1. **Use Supabase Auth**: Leverage Supabase's built-in authentication system
2. **Server-Side Verification**: Implement an Edge Function that verifies credentials server-side and returns only a success/failure response
3. **API Key Protection**: Require an API key for the login verification endpoint

This is not an immediate security vulnerability but represents an architectural improvement opportunity.

---

## Verification Steps

After applying the manual configurations:

1. **Test Auth Connection Scaling**:
   - Monitor auth connection usage in Dashboard
   - Verify percentage-based allocation is active

2. **Test Password Breach Detection**:
   - Try creating a test user with a known compromised password (e.g., "password123")
   - Verify the system rejects the password

3. **Test Application Functionality**:
   - Verify admin users can manage clients
   - Verify client login still works
   - Verify users can access their own profiles
   - Check query performance in Database logs

---

## Support Resources

- [Supabase RLS Performance Guide](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/auth-helpers)
- [Database Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [HaveIBeenPwned Integration](https://supabase.com/docs/guides/auth/passwords)

---

**Last Updated**: 2025-12-20
**Migration Files**:
- `20251220191052_fix_security_and_performance_issues.sql`
- `fix_remaining_rls_performance_issue.sql`
