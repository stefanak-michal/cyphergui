# Role-Based Access Control (RBAC) Research for CypherGUI

## Executive Summary

This document provides a comprehensive analysis of Role-Based Access Control (RBAC) capabilities across all graph databases supported by CypherGUI, with the goal of determining if a unified RBAC implementation is feasible for the application.

## Supported Graph Databases

According to the README.md, CypherGUI supports the following graph databases with Bolt protocol:

1. **Neo4j** - Fully supported and tested
2. **Memgraph** - Fully supported and tested
3. **Amazon Neptune** - Supported but not tested (requires access)
4. **DozerDB** - Fully supported and tested

## RBAC Capabilities Analysis

### 1. Neo4j

**RBAC Support:** ✅ **Yes (Enterprise Edition)**

**Key Features:**

- Comprehensive Role-Based Access Control (RBAC) system
- Fine-grained privileges that can be granted or denied to roles
- Built-in roles: PUBLIC, READER, EDITOR, PUBLISHER, ARCHITECT, ADMIN
- Custom roles can be created with specific privileges
- Privileges can be scoped to specific databases, labels, relationships, or properties
- Both allowlist (GRANT) and denylist (DENY) mechanisms

**Available Queries:**

```cypher
SHOW CURRENT USER           // Shows current user info and roles
SHOW USER PRIVILEGES        // Shows privileges for current user
SHOW ROLES                  // Lists all roles
SHOW ROLES WITH USERS       // Shows which users have which roles
SHOW ROLE PRIVILEGES        // Shows privileges for all roles
```

**Authorization Model:**

- Users → Roles → Privileges
- Privileges include: READ, MATCH, WRITE, CREATE, DELETE, SET, REMOVE, etc.
- Can restrict access at graph level, database level, or even specific labels/types

**Important Notes:**

- RBAC features are available in **Neo4j Enterprise Edition** only
- Community Edition has basic authentication but no fine-grained access control
- All queries must be executed against the system database for admin operations
- Works seamlessly over Bolt protocol

**Documentation:**

- [Neo4j Authentication & Authorization](https://neo4j.com/docs/operations-manual/current/authentication-authorization/)
- [Built-in Roles](https://neo4j.com/docs/operations-manual/current/authentication-authorization/built-in-roles/)
- [Managing Roles](https://neo4j.com/docs/operations-manual/current/authentication-authorization/manage-roles/)

### 2. Memgraph

**RBAC Support:** ✅ **Yes (Enterprise Edition)**

**Key Features:**

- Role-Based Access Control similar to Neo4j
- Multi-tenant support with database-specific roles
- Fine-grained privilege system for Cypher query types
- Users can have different roles on different databases
- Authentication/authorization operations require AUTH privilege and access to "memgraph" database

**Available Queries:**

```cypher
SHOW CURRENT USER           // Shows current username
SHOW CURRENT ROLE           // Shows current role
SHOW USERS                  // Lists all users
SHOW ROLES                  // Lists all roles
SHOW PRIVILEGES FOR <user>  // Shows privileges for a specific user
SHOW PRIVILEGES FOR ROLE <role>  // Shows privileges for a specific role
```

**Authorization Model:**

- Users → Roles → Privileges (similar to Neo4j)
- Privileges tied to Cypher query types: MATCH, CREATE, DELETE, SET, REMOVE, etc.
- Database-scoped roles for multi-tenant environments
- Resource limits can be configured per role

**Important Notes:**

- RBAC is an **Enterprise feature**
- Community Edition supports basic user creation and password management
- As of v3.5, authentication/authorization operations require stricter privileges
- Works over Bolt protocol
- Some reported issues with database-specific privilege display (see GitHub issues #3341, #3136)

**Documentation:**

- [Memgraph Authentication & Authorization](https://memgraph.com/docs/database-management/authentication-and-authorization)
- [Query Privileges Reference](https://memgraph.com/docs/database-management/authentication-and-authorization/query-privileges)
- [Users Management](https://memgraph.com/docs/database-management/authentication-and-authorization/users)

### 3. Amazon Neptune

**RBAC Support:** ⚠️ **Partially (AWS IAM-based)**

**Key Features:**

- Uses AWS IAM for access control instead of traditional database RBAC
- Authentication via AWS Signature Version 4 (SigV4)
- Access control managed through IAM policies, roles, and permissions
- Can implement Relationship-Based Access Control (ReBAC) using Amazon Verified Permissions

**Authorization Model:**

- AWS IAM Policies control access to Neptune resources
- IAM roles can be assigned to users/applications
- Fine-grained access requires combining Neptune with Amazon Verified Permissions
- ReBAC enables authorization based on graph relationships

**Important Notes:**

- **No traditional database-level RBAC commands** (no `SHOW CURRENT USER`, `SHOW ROLES`, etc.)
- Access control is external to the database, managed at AWS level
- All Bolt connections must use signed requests with SigV4 when IAM auth is enabled
- Bolt protocol supported over TCP only (no WebSockets)
- Token renewal issues existed in some drivers but have been improved

**Challenges:**

- Cannot query user roles/privileges from within the database
- RBAC is managed outside the database in AWS IAM console
- Different paradigm from Neo4j/Memgraph approach
- Requires AWS credentials and permissions management

**Documentation:**

- [Neptune Bolt Protocol Guide](https://docs.aws.amazon.com/neptune/latest/userguide/access-graph-opencypher-bolt.html)
- [IAM Authentication](https://docs.aws.amazon.com/neptune/latest/userguide/iam-auth-connecting-python.html)
- [Managing Access with IAM](https://docs.aws.amazon.com/neptune/latest/userguide/security-iam-access-manage.html)
- [ReBAC with Verified Permissions](https://aws.amazon.com/blogs/security/how-to-implement-relationship-based-access-control-with-amazon-verified-permissions-and-amazon-neptune/)

### 4. DozerDB

**RBAC Support:** ❌ **No (Feature Requested)**

**Current Status:**

- DozerDB is a fork of Neo4j Community Edition
- **No built-in RBAC support**
- Basic authentication only (username/password)
- Community has requested RBAC as a feature (GitHub Issue #31)

**Feature Request Details:**

- Users want read-only roles, custom roles, and audit capabilities
- No timeline for implementation
- Would need to be implemented at application level currently

**Important Notes:**

- Being based on Neo4j Community, it inherits the same RBAC limitations
- Any RBAC would need to be handled by the client application
- No queries available to check roles or privileges
- Authentication works over Bolt protocol

**Documentation:**

- [DozerDB GitHub Issue #31](https://github.com/DozerDB/dozerdb-core/issues/31) - RBAC feature request

## Other Bolt-Compatible Databases

**Research Findings:**

- **Cypher for Apache Spark (CAPS)**: Some Bolt support for certain operations, but primarily a processing framework
- **Other OpenCypher-compatible databases**: Any database implementing OpenCypher and Bolt theoretically works, but mainstream alternatives like TigerGraph, ArangoDB, Dgraph, and OrientDB do not support Bolt natively
- **No additional mainstream databases** found beyond the four already listed in CypherGUI

## Unified RBAC Implementation Analysis

### Commonalities

1. **Neo4j and Memgraph:**
    - Very similar RBAC models (User → Role → Privilege)
    - Similar query syntax for checking roles and privileges
    - Both use `SHOW CURRENT USER`, `SHOW ROLES`, `SHOW PRIVILEGES`
    - Both restrict RBAC to Enterprise Editions
    - Both work seamlessly over Bolt protocol

2. **Common Privilege Concepts:**
    - Both support privileges for: MATCH, CREATE, DELETE, SET, REMOVE
    - Both have hierarchical role systems
    - Both allow custom roles

### Differences

1. **Neptune:**
    - Completely different paradigm (AWS IAM instead of database RBAC)
    - No ability to query roles/privileges from within database
    - External access control management
    - Requires AWS-specific authentication (SigV4)

2. **DozerDB:**
    - No RBAC at all
    - Would require application-level implementation

### Feasibility Assessment

**Can RBAC be implemented in a unified way?** ⚠️ **Partially**

#### Feasible Approach:

1. **For Neo4j and Memgraph (High Compatibility):**
    - Can implement unified RBAC checking using similar queries
    - Query `SHOW CURRENT USER` to get user roles
    - Query `SHOW USER PRIVILEGES` or `SHOW PRIVILEGES FOR <user>` to get permissions
    - Parse results to determine what UI features to enable/disable
    - Handle minor syntax differences in application code

2. **For Neptune (Low Compatibility):**
    - Cannot query RBAC from database
    - Would need AWS IAM SDK integration to check permissions
    - Significantly different implementation
    - May not be practical within CypherGUI's current architecture

3. **For DozerDB (No Support):**
    - No RBAC to check
    - Either:
        - Treat as admin (current behavior), or
        - Implement application-level role management (complex)

## Recommendations

### Short-term (Immediate Implementation)

1. **Implement RBAC support for Neo4j Enterprise and Memgraph Enterprise:**
    - Add user privilege checking on login/connection
    - Query current user roles and privileges
    - Disable UI features based on user permissions:
        - Hide/disable "Create" buttons if user lacks CREATE privilege
        - Hide/disable "Delete" buttons if user lacks DELETE privilege
        - Hide/disable "Edit" buttons if user lacks WRITE/SET privilege
        - Make Query editor read-only if user lacks WRITE privileges
    - Show user role information in UI (e.g., header or profile section)
    - Display informative error messages when operations fail due to permissions

2. **Detection Logic:**

    ```typescript
    // Pseudo-code
    async function detectRBACSupport() {
        try {
            const result = await db.query('SHOW CURRENT USER');
            // If successful, RBAC is available
            return true;
        } catch (error) {
            // RBAC not supported or Community Edition
            return false;
        }
    }
    ```

3. **Edition Detection:**
    - Try executing `SHOW CURRENT USER`
    - If it fails, assume Community Edition or no RBAC
    - Fall back to current "admin mode" behavior

### Medium-term (Future Enhancement)

1. **Add configuration option:**
    - Let users manually specify RBAC mode (Auto-detect, Enabled, Disabled)
    - Store preference in localStorage

2. **Role-based UI customization:**
    - Different UI layouts for different roles (viewer, editor, admin)
    - Color-coded role indicators

3. **Audit logging:**
    - Log failed operations due to insufficient privileges
    - Help users understand why certain actions failed

### Long-term (Advanced Features)

1. **Neptune IAM Integration:**
    - If there's significant Neptune user demand
    - Would require AWS SDK integration
    - Separate implementation path

2. **DozerDB Application-level RBAC:**
    - Only if DozerDB doesn't implement native RBAC
    - Would require custom user/role management in CypherGUI

## Implementation Priority

**Priority 1 (High Value, Low Effort):**

- ✅ Neo4j Enterprise RBAC support
- ✅ Memgraph Enterprise RBAC support
- ✅ Automatic detection and graceful fallback

**Priority 2 (Medium Value, Medium Effort):**

- UI adjustments based on privileges
- User role display
- Better error messages for permission failures

**Priority 3 (Lower Value, Higher Effort):**

- Neptune IAM integration
- DozerDB custom RBAC
- Advanced audit logging

## Conclusion

**Yes, RBAC can be implemented in a unified way for Neo4j and Memgraph**, which represent the two most mature and well-tested databases in CypherGUI's support matrix. These two databases share very similar RBAC models and query syntax, making a unified implementation feasible and valuable.

**Neptune and DozerDB** present challenges:

- Neptune uses a fundamentally different access control model (AWS IAM)
- DozerDB has no RBAC support at all

**Recommendation:** Implement RBAC support for Neo4j and Memgraph Enterprise editions as a first phase. This will provide immediate value to the majority of enterprise users while maintaining backward compatibility with Community editions through automatic detection and graceful fallback.

The implementation should:

1. Be non-breaking (continue to work with Community editions)
2. Automatically detect RBAC availability
3. Enhance UX by hiding/disabling unavailable features
4. Provide clear feedback when operations fail due to permissions
5. Maintain the current "admin mode" behavior when RBAC is not available

This approach balances user value, implementation complexity, and maintainability.

---

**Document Version:** 1.0  
**Date:** 2025-11-05  
**Author:** GitHub Copilot (Research Agent)  
**Related Issue:** [Take into account authorization](https://github.com/stefanak-michal/cyphergui/issues/XXX)
