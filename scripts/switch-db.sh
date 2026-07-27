#!/usr/bin/env bash
# Switch Prisma schema between SQLite (dev) and PostgreSQL (prod)

set -e

SCHEMA_DIR="prisma"
SQLITE_SCHEMA="$SCHEMA_DIR/schema.sqlite.prisma"
POSTGRES_SCHEMA="$SCHEMA_DIR/schema.postgres.prisma"
ACTIVE_SCHEMA="$SCHEMA_DIR/schema.prisma"

usage() {
    echo "Usage: $0 [sqlite|postgres]"
    echo ""
    echo "  sqlite   - Use SQLite for local development (no PostgreSQL needed)"
    echo "  postgres - Use PostgreSQL for production"
    echo ""
    echo "Current active schema:"
    if [ -L "$ACTIVE_SCHEMA" ] || [ -f "$ACTIVE_SCHEMA" ]; then
        if grep -q 'provider = "sqlite"' "$ACTIVE_SCHEMA" 2>/dev/null; then
            echo "  → SQLite"
        elif grep -q 'provider = "postgresql"' "$ACTIVE_SCHEMA" 2>/dev/null; then
            echo "  → PostgreSQL"
        else
            echo "  → Unknown"
        fi
    else
        echo "  → None"
    fi
    exit 1
}

if [ $# -eq 0 ]; then
    usage
fi

case "$1" in
    sqlite)
        if [ ! -f "$SQLITE_SCHEMA" ]; then
            echo "Error: SQLite schema not found at $SQLITE_SCHEMA"
            exit 1
        fi
        cp "$SQLITE_SCHEMA" "$ACTIVE_SCHEMA"
        echo "✓ Switched to SQLite schema"
        echo "  Run: npx prisma migrate dev --name init"
        echo "  Or:  npx prisma db push"
        ;;
    postgres)
        if [ ! -f "$POSTGRES_SCHEMA" ]; then
            # Create postgres schema from current if not exists
            cp "$ACTIVE_SCHEMA" "$POSTGRES_SCHEMA" 2>/dev/null || true
            # Ensure it uses postgresql
            sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$POSTGRES_SCHEMA"
            sed -i 's/url      = env("DATABASE_URL")/url      = env("DATABASE_URL")\n  schemas  = ["accounting"]/' "$POSTGRES_SCHEMA"
        fi
        cp "$POSTGRES_SCHEMA" "$ACTIVE_SCHEMA"
        echo "✓ Switched to PostgreSQL schema"
        echo "  Run: npx prisma migrate deploy"
        ;;
    *)
        usage
        ;;
esac

# Regenerate Prisma Client
echo "  Regenerating Prisma Client..."
npx prisma generate