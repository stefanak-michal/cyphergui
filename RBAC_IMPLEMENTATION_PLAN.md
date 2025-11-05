# RBAC Implementation Plan for CypherGUI

## Quick Summary

After comprehensive research, **unified RBAC implementation is feasible for Neo4j and Memgraph** but challenging for Neptune and DozerDB.

## Database RBAC Support Matrix

| Database           | RBAC Support       | Query Compatibility     | Implementation Priority |
| ------------------ | ------------------ | ----------------------- | ----------------------- |
| **Neo4j**          | ✅ Enterprise Only | High (Standard queries) | **Priority 1**          |
| **Memgraph**       | ✅ Enterprise Only | High (Similar to Neo4j) | **Priority 1**          |
| **Amazon Neptune** | ⚠️ AWS IAM Only    | Low (External IAM)      | Priority 3              |
| **DozerDB**        | ❌ Not Available   | None                    | Priority 3              |

## Key Findings

### ✅ **Unified Implementation IS Possible for Neo4j + Memgraph**

Both databases share:

- Similar RBAC models (User → Role → Privilege)
- Compatible query syntax (`SHOW CURRENT USER`, `SHOW PRIVILEGES`)
- Similar privilege types (MATCH, CREATE, DELETE, SET, REMOVE)
- Both Enterprise-only features with graceful Community edition fallback

### ⚠️ **Different Approaches Needed**

- **Neptune**: Uses AWS IAM (external), cannot query roles from database
- **DozerDB**: No RBAC (feature requested in issue #31)

## Recommended Implementation Strategy

### Phase 1: Core RBAC Support (Neo4j & Memgraph)

1. **Add RBAC detection on connection:**

    ```typescript
    async detectRBAC() {
      try {
        await db.query('SHOW CURRENT USER');
        return true; // RBAC supported
      } catch {
        return false; // Community Edition or no RBAC
      }
    }
    ```

2. **Query user privileges:**

    ```cypher
    SHOW CURRENT USER          -- Get user and roles
    SHOW USER PRIVILEGES       -- Get current user privileges
    ```

3. **Map privileges to UI features:**
    - `CREATE` privilege → Enable "Add Node/Relationship" buttons
    - `DELETE` privilege → Enable "Delete" buttons
    - `SET/REMOVE` privilege → Enable "Edit" features
    - `MATCH` privilege → Allow viewing data
    - No write privileges → Make editors read-only

4. **UI Adjustments:**
    - Show user role in header/profile
    - Disable/hide buttons based on privileges
    - Show helpful error messages on permission failures
    - Add tooltip explaining why feature is disabled

### Phase 2: Enhanced UX

- Role indicator in UI (badge showing current role)
- Better error messages for failed operations
- Privilege-based menu filtering
- Configuration option to override RBAC checks (for testing)

### Phase 3: Future Enhancements (Optional)

- Neptune AWS IAM integration (if demand exists)
- DozerDB application-level RBAC (if native support not added)
- Advanced audit logging

## Technical Implementation Notes

### Detecting Database Type & RBAC

```typescript
// In db.ts or new rbac.ts module
interface UserPrivileges {
    canRead: boolean;
    canWrite: boolean;
    canCreate: boolean;
    canDelete: boolean;
    canAdmin: boolean;
    roles: string[];
}

async function getUserPrivileges(): Promise<UserPrivileges | null> {
    // Return null if RBAC not supported
    if (ecosystem === Ecosystem.Neptune || ecosystem === Ecosystem.DozerDB) {
        return null; // Not supported
    }

    try {
        const userResult = await query('SHOW CURRENT USER');
        const privResult = await query('SHOW USER PRIVILEGES');

        // Parse results and return privilege object
        return parsePrivileges(userResult, privResult);
    } catch (error) {
        // Community Edition or error
        return null;
    }
}
```

### UI Component Updates

```typescript
// Example: Conditional rendering based on privileges
{privileges?.canCreate && (
  <Button onClick={createNode}>Create Node</Button>
)}

{!privileges?.canCreate && (
  <Button disabled title="Insufficient privileges">
    Create Node
  </Button>
)}
```

### Graceful Fallback

- If RBAC not detected: Assume all privileges (current behavior)
- If RBAC detected but query fails: Show warning, fall back to all privileges
- Cache privilege information to avoid repeated queries

## Benefits

1. **Better UX**: Users see only what they can do
2. **Fewer Errors**: Disabled buttons prevent permission failures
3. **Security**: Respects database access controls
4. **Transparency**: Users understand their role limitations
5. **Enterprise-Ready**: Aligns with enterprise security practices

## Non-Breaking Changes

- ✅ Works with existing Community Edition databases (no RBAC)
- ✅ Works with existing Enterprise databases (enables RBAC)
- ✅ No changes required to user workflows
- ✅ Backward compatible

## Testing Strategy

1. Test with Neo4j Community (no RBAC)
2. Test with Neo4j Enterprise (various roles: READER, EDITOR, ADMIN)
3. Test with Memgraph Community (no RBAC)
4. Test with Memgraph Enterprise (various roles)
5. Test with Neptune (confirm graceful handling)
6. Test with DozerDB (confirm graceful handling)

## Estimated Effort

- **Phase 1**: 2-3 days development + testing
- **Phase 2**: 1-2 days for UX enhancements
- **Phase 3**: Future scope (case-by-case)

## Files to Modify

1. `src/db.ts` - Add RBAC detection and privilege querying
2. `src/utils/types.ts` - Add privilege types/interfaces
3. `src/utils/contexts.tsx` - Add privilege context
4. `src/Logged.tsx` - Add privilege state management
5. `src/page/*.tsx` - Update pages to use privilege checks
6. `src/components/*.tsx` - Update buttons/actions with privilege checks
7. `src/layout/Header.tsx` - Display current role (if exists)

## Example Privilege Mappings

### Neo4j/Memgraph Privileges → CypherGUI Features

| Database Privilege    | CypherGUI Feature                         |
| --------------------- | ----------------------------------------- |
| `MATCH`               | View nodes/relationships, Query execution |
| `CREATE`              | Create new nodes/relationships            |
| `DELETE`              | Delete nodes/relationships                |
| `SET`                 | Edit properties                           |
| `REMOVE`              | Remove properties/labels                  |
| `WRITE`               | General write operations                  |
| `ALL DBMS PRIVILEGES` | Admin features (databases, users)         |

## References

- [Neo4j RBAC Documentation](https://neo4j.com/docs/operations-manual/current/authentication-authorization/manage-roles/)
- [Memgraph RBAC Documentation](https://memgraph.com/docs/database-management/authentication-and-authorization)
- [Neptune IAM Guide](https://docs.aws.amazon.com/neptune/latest/userguide/security-iam-access-manage.html)
- [DozerDB RBAC Feature Request](https://github.com/DozerDB/dozerdb-core/issues/31)

---

**Next Steps:**

1. Review and approve this plan
2. Create feature branch for implementation
3. Implement Phase 1 (Core RBAC Support)
4. Test across all supported databases
5. Document usage for end users
