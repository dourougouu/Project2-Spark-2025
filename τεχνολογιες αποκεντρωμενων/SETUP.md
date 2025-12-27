# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install Spark Python dependencies
cd spark
pip install -r requirements.txt
cd ..
```

### 2. Setup MongoDB

Make sure MongoDB is installed and running:

```bash
# On Windows
mongod

# On Linux/Mac
sudo systemctl start mongod
# or
mongod --dbpath /path/to/data
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` with your settings if needed (defaults should work for local development).

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
npm start
# or for development
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run client
```

### 5. Populate Initial Data

In a new terminal, trigger initial sync:

```bash
# Sync from EDX
curl -X POST http://localhost:5000/api/sync/edx

# Sync from Coursera
curl -X POST http://localhost:5000/api/sync/coursera
```

Or use a tool like Postman to make POST requests to:
- `http://localhost:5000/api/sync/edx`
- `http://localhost:5000/api/sync/coursera`

### 6. Run Spark ML Pipeline (Optional)

```bash
# Make sure Spark is installed and configured
spark-submit spark/ml_pipeline.py
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` or `mongo` should connect
- Check the connection string in `.env`
- Default: `mongodb://localhost:27017/course-aggregator`

### Port Already in Use
- Change `PORT` in `.env` for backend
- Change port in `frontend/package.json` scripts if needed

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in `.env` or `frontend/.env`

### Spark Issues
- Ensure Java 8+ is installed
- Check Spark installation: `spark-submit --version`
- For MongoDB connector, you may need to install separately:
  ```bash
  pip install pymongo-spark
  ```

## Development Tips

1. **Auto-reload**: Use `npm run dev` for backend auto-reload
2. **Frontend hot-reload**: React development server has hot-reload enabled
3. **Database inspection**: Use MongoDB Compass or `mongosh` to inspect data
4. **API testing**: Use Postman, curl, or the browser for API endpoints

## Next Steps

1. Replace mock data in connectors with real API calls
2. Configure Spark for your environment
3. Customize the UI styling
4. Add authentication if needed
5. Deploy to production

