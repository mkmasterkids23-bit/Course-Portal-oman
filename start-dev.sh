#!/bin/bash
cd /home/z/my-project
export DATABASE_URL="postgresql://postgres:d845eac423f8489847a60bfa4fd27476@xb3ib7ut.us-east.database.insforge.app:5432/insforge?sslmode=require"
exec /usr/local/bin/bun run dev
