# Stock Transfer Management System

A full-stack web application for managing warehouse stock and inter-warehouse transfers built with the MEAN stack (MongoDB, Express.js, Angular, Node.js).

## Features

- **Warehouse CRUD** — Create, list, view, and soft-delete warehouses with name, location, and stock inventory
- **Stock Level Management** — Maintain per-SKU quantities at each warehouse with non-negative constraint
- **Transfer Request Creation** — Specify source warehouse, destination warehouse, SKU, quantity, and optional notes
- **Transfer Status Lifecycle** — `PENDING → APPROVED → IN_TRANSIT → COMPLETED` with guarded transitions
- **Stock Mutation on Completion** — Atomic debit source and credit destination when status reaches `COMPLETED`
- **Transfer List/History** — Paginated, filterable by warehouse, status, and date range

## Tech Stack

| Layer    | Technology        |
| -------- | ----------------- |
| Frontend | Angular 19        |
| Backend  | Express.js (TypeScript) |
| Database | MongoDB           |
| ORM      | Mongoose          |

## Project Structure

```
stock-transfer/
├── backend/
│   ├── src/
│   │   ├── config/          # db.ts, env.ts
│   │   ├── models/          # Warehouse.model.ts, Transfer.model.ts
│   │   ├── services/        # warehouse.service.ts, transfer.service.ts
│   │   ├── controllers/     # warehouse.controller.ts, transfer.controller.ts
│   │   ├── routes/          # warehouse.routes.ts, transfer.routes.ts
│   │   ├── middleware/      # errorHandler.ts, validate.ts
│   │   ├── __tests__/       # Unit tests
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── warehouses/      # list, create, detail
│   │   ├── transfers/       # list, create, detail
│   │   ├── shared/          # services, interceptors, interfaces
│   │   └── core/            # layout
│   └── angular.json
└── README.md
```

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- Angular CLI (`npm install -g @angular/cli`)

## Local Setup

### Backend

```bash
cd stock-transfer/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Frontend

```bash
cd stock-transfer/frontend

# Install dependencies
npm install

# Run in development mode
ng serve

# Build for production
ng build --configuration=production
```

## Environment Variables

### Backend (.env)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-transfer
NODE_ENV=development
```

### Frontend (environment.ts)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

## API Documentation

Base URL: `/api/v1`

### Warehouses

| Method   | Endpoint                | Description                    |
| -------- | ----------------------- | ------------------------------ |
| `POST`   | `/warehouses`           | Create a new warehouse         |
| `GET`    | `/warehouses`           | List all active warehouses     |
| `GET`    | `/warehouses/:id`       | Get warehouse details          |
| `PATCH`  | `/warehouses/:id/stock` | Adjust stock for a SKU         |
| `DELETE` | `/warehouses/:id`       | Soft delete warehouse          |

### Transfers

| Method  | Endpoint                | Description                    |
| ------- | ----------------------- | ------------------------------ |
| `POST`  | `/transfers`            | Create transfer request        |
| `GET`   | `/transfers`            | List transfers (paginated)     |
| `GET`   | `/transfers/:id`        | Get transfer details           |
| `PATCH` | `/transfers/:id/status` | Update transfer status         |
| `GET`   | `/transfers/:id/transitions` | Get allowed transitions   |

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

## Sample Test Flow

```bash
# 1. Create Warehouse A
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Content-Type: application/json" \
  -d '{"name": "Warehouse A", "location": "Mumbai"}'

# 2. Create Warehouse B
curl -X POST http://localhost:3000/api/v1/warehouses \
  -H "Content-Type: application/json" \
  -d '{"name": "Warehouse B", "location": "Delhi"}'

# 3. Seed stock in Warehouse A (use the ID from step 1)
curl -X PATCH http://localhost:3000/api/v1/warehouses/:aId/stock \
  -H "Content-Type: application/json" \
  -d '{"sku": "SKU-001", "quantity": 100}'

# 4. Create transfer A → B
curl -X POST http://localhost:3000/api/v1/transfers \
  -H "Content-Type: application/json" \
  -d '{"sourceWarehouse": ":aId", "destWarehouse": ":bId", "sku": "SKU-001", "quantity": 30}'

# 5. Approve transfer
curl -X PATCH http://localhost:3000/api/v1/transfers/:id/status \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'

# 6. Mark as In Transit
curl -X PATCH http://localhost:3000/api/v1/transfers/:id/status \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_TRANSIT"}'

# 7. Complete transfer
curl -X PATCH http://localhost:3000/api/v1/transfers/:id/status \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}'

# 8. Verify Warehouse A stock (should be 70)
curl http://localhost:3000/api/v1/warehouses/:aId

# 9. Verify Warehouse B stock (should be 30)
curl http://localhost:3000/api/v1/warehouses/:bId
```

## Transfer Status FSM

```
PENDING → APPROVED → IN_TRANSIT → COMPLETED
                ↘
             CANCELLED  (before dispatch only)
```

## Deployment

### Database (MongoDB Atlas) — Do this first

1. Create free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user with read/write permissions
3. Whitelist `0.0.0.0/0` for demo (or your IPs)
4. Copy connection string — format: `mongodb+srv://user:pass@cluster.mongodb.net/stock-transfer`

### Backend (Railway)

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `stock-transfer/backend` folder (or set root directory to `backend`)
4. Railway will auto-detect Node.js and use `railway.json`
5. Go to **Variables** tab and add:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/stock-transfer
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend.vercel.app
   ```
6. Railway will auto-deploy and give you a URL like `https://stock-transfer-backend.up.railway.app`
7. Test health: `https://your-url.up.railway.app/health`

### Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Set **Root Directory** to `frontend`
5. Framework Preset: **Angular**
6. Click **Deploy**
7. After deployment, update `frontend/src/environments/environment.prod.ts` with your Railway URL:
   ```typescript
   apiUrl: 'https://your-railway-url.up.railway.app/api/v1'
   ```
8. Also update **CORS_ORIGIN** in Railway with your Vercel URL
9. Redeploy both to apply changes

## License

MIT
