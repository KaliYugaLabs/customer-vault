#!/bin/bash

# Firebase Auto-Setup Script
# This script automates Firebase setup as much as possible

set -e

echo "🔥 Customer Manager - Firebase Auto-Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
node --version
echo ""

# Check if Firebase CLI is available
echo -e "${BLUE}Checking Firebase CLI...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}Firebase CLI not found in PATH, using npx...${NC}"
    FIREBASE="npx firebase"
else
    FIREBASE="firebase"
fi

$FIREBASE --version
echo ""

# Step 1: Login Check
echo -e "${BLUE}Step 1: Checking Firebase login status...${NC}"
if ! $FIREBASE projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  You need to login to Firebase${NC}"
    echo "Please run: $FIREBASE login"
    echo "Then re-run this script"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Firebase${NC}"
echo ""

# Step 2: List available projects
echo -e "${BLUE}Step 2: Available Firebase projects:${NC}"
$FIREBASE projects:list | head -20
echo ""

# Step 3: Get project ID
echo -e "${YELLOW}Enter your Firebase project ID from the list above:${NC}"
read PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}❌ No project ID provided${NC}"
    exit 1
fi

# Step 4: Update configuration files
echo ""
echo -e "${BLUE}Step 4: Updating configuration files...${NC}"

# Update .firebaserc
cat > .firebaserc <<EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF
echo -e "${GREEN}✅ Updated .firebaserc${NC}"

# Step 5: Check Firestore status
echo ""
echo -e "${BLUE}Step 5: Checking Firestore database...${NC}"
$FIREBASE firestore:databases:list --project=$PROJECT_ID 2>/dev/null || echo -e "${YELLOW}⚠️  Firestore not yet initialized${NC}"

# Step 6: Deploy Firestore rules
echo ""
echo -e "${BLUE}Step 6: Deploying Firestore security rules...${NC}"
$FIREBASE deploy --only firestore:rules --project=$PROJECT_ID
echo -e "${GREEN}✅ Firestore rules deployed${NC}"

# Step 7: Deploy Firestore indexes
echo ""
echo -e "${BLUE}Step 7: Deploying Firestore indexes...${NC}"
$FIREBASE deploy --only firestore:indexes --project=$PROJECT_ID
echo -e "${GREEN}✅ Firestore indexes deployed${NC}"

# Step 8: Get Firebase config
echo ""
echo -e "${BLUE}Step 8: Getting Firebase configuration...${NC}"
echo -e "${YELLOW}Please visit: https://console.firebase.google.com/project/$PROJECT_ID/settings/general${NC}"
echo -e "${YELLOW}Click '</>' to add a web app and copy the config values${NC}"
echo ""

echo "Enter the following values:"
read -p "API Key: " API_KEY
read -p "Auth Domain: " AUTH_DOMAIN
read -p "Project ID: " PROJECT_ID_CONFIG
read -p "Storage Bucket: " STORAGE_BUCKET
read -p "Messaging Sender ID: " MESSAGING_SENDER_ID
read -p "App ID: " APP_ID

# Step 9: Create environment files
echo ""
echo -e "${BLUE}Step 9: Creating environment files...${NC}"

mkdir -p frontend-v2/src/environments

cat > frontend-v2/src/environments/environment.ts <<EOF
export const environment = {
  production: false,
  firebase: {
    apiKey: '$API_KEY',
    authDomain: '$AUTH_DOMAIN',
    projectId: '$PROJECT_ID_CONFIG',
    storageBucket: '$STORAGE_BUCKET',
    messagingSenderId: '$MESSAGING_SENDER_ID',
    appId: '$APP_ID'
  },
  apiUrl: 'http://localhost:3000/api/v1',
  nominatimUrl: 'https://nominatim.openstreetmap.org'
};
EOF
echo -e "${GREEN}✅ Created environment.ts${NC}"

cat > frontend-v2/src/environments/environment.prod.ts <<EOF
export const environment = {
  production: true,
  firebase: {
    apiKey: process.env['FIREBASE_API_KEY'] || '$API_KEY',
    authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || '$AUTH_DOMAIN',
    projectId: process.env['FIREBASE_PROJECT_ID'] || '$PROJECT_ID_CONFIG',
    storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || '$STORAGE_BUCKET',
    messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || '$MESSAGING_SENDER_ID',
    appId: process.env['FIREBASE_APP_ID'] || '$APP_ID'
  },
  apiUrl: process.env['API_URL'] || '/api/v1',
  nominatimUrl: 'https://nominatim.openstreetmap.org'
};
EOF
echo -e "${GREEN}✅ Created environment.prod.ts${NC}"

# Step 10: Install dependencies
echo ""
echo -e "${BLUE}Step 10: Installing frontend dependencies...${NC}"
cd frontend-v2
npm install
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Firebase setup complete!${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Enable Email/Password Authentication${NC}"
echo "Visit: https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"
echo "Enable 'Email/Password' provider"
echo ""
echo "Next steps:"
echo "  1. cd frontend-v2"
echo "  2. npm start"
echo ""
echo "Your app will be available at: http://localhost:4200"
echo "Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
