#!/bin/bash
read -p "Postgres login string:" url
export $DATABASE_URL=$url
npx prisma db seed --preview-feature
