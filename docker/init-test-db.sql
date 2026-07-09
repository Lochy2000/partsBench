-- Runs once on first container start (docker-entrypoint-initdb.d).
-- POSTGRES_DB already creates the "partsbench" dev database; this adds a
-- separate "partsbench_test" database so integration tests never touch dev data.
CREATE DATABASE partsbench_test;
