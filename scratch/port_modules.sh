#!/bin/bash

# Define the modules to port
MODULES=("inventory" "production" "maintenance" "procurement")

for mod in "${MODULES[@]}"; do
  echo "Porting $mod..."
  
  # Create Next.js route folder
  TARGET_DIR="src/app/dashboard/$mod"
  mkdir -p "$TARGET_DIR"
  
  # Copy all JSX files and convert extension to TSX
  for file in scratch/alnaciim-erp/frontend/src/pages/$mod/*.jsx; do
    basename=$(basename "$file" .jsx)
    
    # If the file is named after the module (e.g. InventoryPage.jsx), rename to page.tsx
    if [[ "$basename" == "${mod^}Page" || "$basename" == "index" ]]; then
      DEST_NAME="page.tsx"
    else
      DEST_NAME="${basename}.tsx"
    fi
    
    cp "$file" "$TARGET_DIR/$DEST_NAME"
    
    # Add 'use client' at the top if missing
    if ! head -n 1 "$TARGET_DIR/$DEST_NAME" | grep -q "'use client'"; then
      echo -e "'use client';\n$(cat "$TARGET_DIR/$DEST_NAME")" > "$TARGET_DIR/$DEST_NAME"
    fi
    
    # Fix imports using sed
    sed -i '' 's|\.\./\.\./components/useApi|@/components/erp/useApi|g' "$TARGET_DIR/$DEST_NAME"
    sed -i '' 's|\.\./\.\./components/Table|@/components/erp/Table|g' "$TARGET_DIR/$DEST_NAME"
    sed -i '' 's|\.\./\.\./components/GroupedTabs|@/components/erp/GroupedTabs|g' "$TARGET_DIR/$DEST_NAME"
    sed -i '' 's|\.\./\.\./components/DateFilterBar|@/components/erp/DateFilterBar|g' "$TARGET_DIR/$DEST_NAME"
    sed -i '' 's|\.\./\.\./api/client|@/components/erp/client|g' "$TARGET_DIR/$DEST_NAME"
    sed -i '' 's|\.\./\.\./context/AuthContext|@/components/erp/AuthContext|g' "$TARGET_DIR/$DEST_NAME"
    
    # Fix local component relative paths within the same module (e.g. import from './MovementsTab')
    sed -i '' 's|\.jsx||g' "$TARGET_DIR/$DEST_NAME"
    
  done
done

echo "Porting complete!"
