-- The app only uses the REST API (PostgREST). Disabling pg_graphql removes the
-- /graphql/v1 schema-introspection surface flagged by the security advisor.
-- Re-enable with: create extension pg_graphql;
drop extension if exists pg_graphql;
