#!/bin/bash
# Navigate to frontend directory
cd frontend

# Fix the remaining routes that use Request in function parameters but not params
find ./app -name "route.ts" -o -name "route.tsx" | xargs sed -i 's/export async function \([A-Z]\+\)(request: Request)/export async function \1(request: NextRequest)/g'

# Fix any GET/POST routes that include params
find ./app -name "route.ts" -o -name "route.tsx" | xargs sed -i 's/export async function \([A-Z]\+\)(request: Request, { params }: { params:/export async function \1(request: NextRequest, { params }: { params:/g'

# Check if we've fixed everything
echo "Checking for any remaining Request references (excluding comments):"
find ./app -name "route.ts" -o -name "route.tsx" | xargs grep -l "request: Request" | xargs grep "request: Request"

echo "Update complete. Please verify your changes."