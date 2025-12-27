# Course Aggregator - Horizontal Repository for Open Courses

A comprehensive course aggregation system that collects courses from multiple MOOC platforms, provides a unified search interface, and uses Apache Spark for large-scale machine learning recommendations and clustering.

## 🎯 Project Overview

This project implements a horizontal repository/aggregator that:
- Collects course data from multiple external repositories (EDX, Coursera, etc.)
- Provides a unified React front-end for search, filtering, and exploration
- Uses Apache Spark for ML-based recommendations and course clustering
- Offers RESTful APIs for course management and analytics

## 🏗️ Architecture

```
┌─────────────┐
│   React     │  Front-end (Search, Filters, Course Details, Analytics)
│  Frontend   │
└──────┬──────┘
       │ REST API
┌──────▼──────┐
│   Express   │  Back-end API Server
│   Backend   │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼────┐
│Mongo│ │Spark │  Data Storage & ML Processing
│ DB  │ │ ML   │
└─────┘ └──────┘
```

## 📋 Features

### Front-end (React)
- ✅ Course search with full-text search
- ✅ Advanced filtering (language, level, category, source)
- ✅ Course details page with full information
- ✅ Similar courses recommendations (Spark-based)
- ✅ Analytics dashboard with statistics
- ✅ Responsive Material-UI design

### Back-end (Node.js/Express)
- ✅ RESTful API endpoints
- ✅ Course CRUD operations
- ✅ Pagination and filtering
- ✅ Connector system for multiple course sources
- ✅ Automatic synchronization scheduler
- ✅ Analytics endpoints

### Data Aggregation
- ✅ EDX connector (with mock data)
- ✅ Coursera connector (with mock data)
- ✅ Unified data schema
- ✅ Full and incremental sync support

### Spark ML Pipeline
- ✅ Text preprocessing (tokenization, stop words removal)
- ✅ Feature extraction (TF-IDF, categorical encoding)
- ✅ K-means clustering
- ✅ Course similarity calculation
- ✅ Integration with MongoDB

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Python 3.8+ (for Spark)
- Apache Spark 3.5.0
- Java 8 or higher (required for Spark)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd course-aggregator
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

4. **Install Spark dependencies**
```bash
cd spark
pip install -r requirements.txt
cd ..
```

5. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

6. **Start MongoDB**
```bash
# Make sure MongoDB is running on localhost:27017
mongod
```

### Running the Application

1. **Start the backend server**
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

2. **Start the frontend**
```bash
npm run client
```

The frontend will run on `http://localhost:3000`

3. **Run Spark ML Pipeline**
```bash
# Make sure Spark is properly configured
spark-submit spark/ml_pipeline.py
```

### Initial Data Sync

To populate the database with courses, trigger a sync:

```bash
# Sync from EDX
curl -X POST http://localhost:5000/api/sync/edx

# Sync from Coursera
curl -X POST http://localhost:5000/api/sync/coursera

# Full sync
curl -X POST http://localhost:5000/api/sync/edx -H "Content-Type: application/json" -d '{"fullSync": true}'
```

## 📁 Project Structure

```
course-aggregator/
├── backend/
│   ├── server.js              # Express server
│   ├── models/
│   │   └── Course.js         # MongoDB course model
│   ├── routes/
│   │   ├── courses.js        # Course endpoints
│   │   ├── sync.js           # Sync endpoints
│   │   └── analytics.js      # Analytics endpoints
│   ├── connectors/
│   │   ├── index.js          # Connector registry
│   │   ├── baseConnector.js  # Base connector class
│   │   ├── edxConnector.js   # EDX connector
│   │   └── courseraConnector.js # Coursera connector
│   └── config/
│       └── scheduler.js       # Automatic sync scheduler
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.js           # Main app component
│   └── public/
├── spark/
│   ├── ml_pipeline.py       # Spark ML pipeline
│   └── requirements.txt     # Python dependencies
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Courses
- `GET /api/courses` - List courses with filters and pagination
- `GET /api/courses/:id` - Get course details
- `GET /api/courses/:id/similar` - Get similar courses (Spark recommendations)
- `GET /api/courses/filters/options` - Get available filter options

### Sync
- `POST /api/sync/:source` - Trigger sync from specific source
- `GET /api/sync/status` - Get sync status for all sources

### Analytics
- `GET /api/analytics` - Get analytics data

## 🧪 Testing

### Manual Testing

1. **Test API endpoints**
```bash
# Get all courses
curl http://localhost:5000/api/courses

# Get course by ID
curl http://localhost:5000/api/courses/<course-id>

# Get similar courses
curl http://localhost:5000/api/courses/<course-id>/similar
```

2. **Test frontend**
- Navigate to `http://localhost:3000`
- Search for courses
- Apply filters
- View course details
- Check analytics dashboard

## 📊 Database Schema

### Course Model
```javascript
{
  title: String,
  description: String,
  shortDescription: String,
  keywords: [String],
  category: String,
  language: String,
  level: String (beginner/intermediate/advanced),
  source: {
    repositoryName: String,
    repositoryUrl: String,
    sourceId: String
  },
  accessLink: String,
  lastUpdated: Date,
  metadata: Object,
  sparkSimilarity: [{
    courseId: ObjectId,
    similarity: Number
  }],
  clusterId: Number
}
```

## 🔧 Configuration

### Environment Variables

- `PORT` - Backend server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `REACT_APP_API_URL` - Frontend API URL
- `SPARK_MASTER` - Spark master URL

## 🎓 Machine Learning Pipeline

The Spark ML pipeline performs:

1. **Text Preprocessing**
   - Tokenization
   - Stop words removal
   - TF-IDF vectorization

2. **Feature Engineering**
   - Categorical encoding (category, level, language)
   - Feature vector assembly

3. **Clustering**
   - K-means clustering (k=5)
   - Cluster assignment

4. **Similarity Calculation**
   - Cosine similarity between courses
   - Top 10 similar courses per course

## 📝 Notes

- The connectors currently use mock data. In production, replace with actual API calls to EDX, Coursera, etc.
- The Spark pipeline requires MongoDB connector for Spark. Install it separately if needed.
- Automatic syncs run daily at 2 AM (configurable in `backend/config/scheduler.js`)

## 🚧 Future Enhancements

- [ ] User accounts and personalization
- [ ] More course sources
- [ ] Advanced ML models (collaborative filtering, embeddings)
- [ ] Admin dashboard
- [ ] Real-time recommendations
- [ ] Course ratings and reviews

## 📄 License

MIT License

## 👥 Authors

Course Aggregator Project Team

---

**Note**: This is a demonstration project. For production use, implement proper error handling, authentication, rate limiting, and security measures.

