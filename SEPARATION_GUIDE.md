# PGB Event Scheduler - Repository Separation Guide

## 🎯 Overview
This guide explains how to separate your monorepo into two independent repositories for Coolify deployment.

## 📁 Current Structure (Monorepo)
```
PGB-EVENTSCHEDULER/
├── backend/          # Node.js API
├── src/              # React Frontend
├── package.json      # Combined dependencies
├── docker-compose.yml
└── uploads/
```

## 🔄 Target Structure (Separated)

### Repository 1: PGB-EVENTSCHEDULER-FRONTEND
```
PGB-EVENTSCHEDULER-FRONTEND/
├── src/              # React app source
├── public/           # Static assets
├── package.json      # Frontend dependencies only
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript config
├── tailwind.config.js
├── Dockerfile        # Frontend container
├── .env.example      # Frontend environment variables
└── README.md         # Frontend deployment guide
```

### Repository 2: PGB-EVENTSCHEDULER-BACKEND
```
PGB-EVENTSCHEDULER-BACKEND/
├── routes/           # API routes
├── models/           # Database models
├── middleware/       # Auth & validation
├── services/         # Business logic
├── uploads/          # File storage
├── package.json      # Backend dependencies only
├── server.ts         # Express server
├── tsconfig.json     # TypeScript config
├── Dockerfile        # Backend container
├── .env.example      # Backend environment variables
└── README.md         # Backend deployment guide
```

## 🚀 Benefits for Coolify Deployment

### 1. Independent Deployment
- Frontend: Static site deployment (Nginx)
- Backend: Node.js application deployment
- Different scaling strategies

### 2. Domain Management
- Frontend: `https://pgb-events.gov.ph`
- Backend: `https://api-pgb-events.gov.ph`

### 3. Environment Isolation
- Separate environment variables
- Independent CI/CD pipelines
- Easier troubleshooting

## 📋 Migration Steps

### Step 1: Create Frontend Repository
1. Copy frontend files to new directory
2. Create frontend-specific package.json
3. Add frontend Dockerfile
4. Configure environment variables

### Step 2: Create Backend Repository
1. Copy backend files to new directory
2. Update package.json (backend only)
3. Update server configuration
4. Configure MongoDB connection

### Step 3: Update Configurations
1. Update API endpoints in frontend
2. Configure CORS for production domain
3. Set up environment variables
4. Create deployment documentation

## 🔧 Configuration Changes Needed

### Frontend Environment Variables
```env
VITE_API_URL=https://api-pgb-events.gov.ph
VITE_SOCKET_URL=https://api-pgb-events.gov.ph
```

### Backend Environment Variables
```env
MONGODB_URI=mongodb://your-coolify-mongo-uri
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://pgb-events.gov.ph
NODE_ENV=production
PORT=5000
```

## 📞 Next Steps
1. Review this separation plan
2. Confirm with IT department
3. Create separated repositories
4. Test deployment process
5. Provide deployment documentation to IT team
