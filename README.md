# Krishi Era AI - Agricultural Intelligence Platform

AI-orchestrated rural resource and market intelligence platform connecting farmers, buyers, transporters, and storage providers through intelligent coordination.

## Overview

Krishi Era AI serves as a neutral intelligence layer for the agricultural ecosystem, optimizing resource planning, produce sales, and rural livelihood creation without owning physical assets.
Deployed link: https://main.d3o65ri2eglx5a.amplifyapp.com/login

we have provided pre-configured user personas that allow you to explore the platform’s full functionality.
You can log in using the following test accounts:

Buyer
Email: buyer@gmail.com
Password: 123456

Farmer
Email: farmer@gmail.com
Password: 123456

Transport Provider
Email: transporter@gmail.com
Password: 123456

Storage Provider
Email: storage@gmail.com
Password: 123456

## Features

- **Farmer Dashboard**: Crop planning, harvest management, AI recommendations
- **Buyer Portal**: Procurement, quality inspection, market insights
- **Transporter Hub**: Route optimization, fleet management, load consolidation
- **Storage Management**: Capacity planning, condition monitoring, booking system
- **Admin Console**: System monitoring, analytics, regional management

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- AWS Account with configured credentials
- AWS CLI installed
- Modern web browser

### Quick Start

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..

# 2. Setup AWS resources (automated)
chmod +x scripts/setup-aws.sh
./scripts/setup-aws.sh

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with AWS values from setup output

# 4. Enable Amazon Bedrock model access (via AWS Console)

# 5. Start backend (Terminal 1)
cd backend && npm run dev

# 6. Start frontend (Terminal 2)
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`

### Detailed Setup Guides

- **[Quick Start Guide](docs/QUICK_START.md)** - Get running in 15 minutes
- **[AWS Setup Guide](docs/AWS_SETUP_GUIDE.md)** - Complete AWS resource setup
- **[Backend README](backend/README.md)** - API documentation and deployment

## Project Structure

```
src/
├── components/          # Shared components
│   └── Layout.tsx      # Main layout with navigation
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── farmer/         # Farmer persona pages
│   ├── buyer/          # Buyer persona pages
│   ├── transporter/    # Transporter persona pages
│   ├── storage/        # Storage provider pages
│   └── admin/          # Admin pages
├── App.tsx             # App router configuration
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Available Routes

- `/` - Main dashboard
- `/farmer` - Farmer dashboard
- `/farmer/crop-planning` - Crop planning tool
- `/farmer/harvest` - Harvest management
- `/buyer` - Buyer dashboard
- `/buyer/procurement` - Procurement interface
- `/buyer/quality` - Quality inspection
- `/transporter` - Transporter dashboard
- `/transporter/routes` - Route optimization
- `/storage` - Storage dashboard
- `/storage/capacity` - Capacity management
- `/admin` - Admin dashboard
- `/admin/monitoring` - System monitoring

## Key Personas

1. **Farmers**: Resource optimization, crop planning, harvest timing
2. **Buyers**: Procurement, quality assessment, market intelligence
3. **Transporters**: Route optimization, fleet management
4. **Storage Providers**: Capacity management, condition monitoring
5. **Administrators**: System monitoring, analytics, regional expansion

## AWS Integration

The platform uses the following AWS services:

**Core Services:**
- DynamoDB - User data, crops, orders, shipments, storage
- S3 - Image and document storage
- Bedrock (Claude 3) - AI recommendations
- Rekognition - Quality assessment
- Location Service - Route optimization
- SNS - Notifications
- IoT Core - Sensor monitoring

**Setup:**
- Automated: Run `./scripts/setup-aws.sh`
- Manual: Follow [AWS Setup Guide](docs/AWS_SETUP_GUIDE.md)
- Verify: Run `./scripts/verify-aws-setup.sh`

See [workflows-and-integrations.md](workflows-and-integrations.md) for detailed architecture.

## Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get started in 15 minutes
- **[AWS Setup Guide](docs/AWS_SETUP_GUIDE.md)** - Complete AWS setup instructions
- **[Get AWS Credentials](docs/GET_AWS_CREDENTIALS.md)** - How to get Access Keys
- **[Install AWS CLI](docs/INSTALL_AWS_CLI.md)** - AWS CLI installation guide
- **[Enable Bedrock](docs/ENABLE_BEDROCK.md)** - Enable AI models in Bedrock
- **[Backend API Docs](backend/README.md)** - API endpoints and deployment
- **[Requirements](.vscode/requirements.md)** - Detailed requirements and user stories
- **[Workflows & Integration](workflows-and-integrations.md)** - Persona workflows and AWS architecture
- **[Scripts README](scripts/README.md)** - Automated setup scripts

## Scripts

Automated scripts for AWS resource management:

```bash
# Setup all AWS resources
./scripts/setup-aws.sh

# Verify setup is complete
./scripts/verify-aws-setup.sh

# Cleanup all resources (use with caution)
./scripts/cleanup-aws.sh
```

## License

Proprietary - Krishi Era AI Platform
