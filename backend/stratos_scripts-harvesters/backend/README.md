# Stratos Backend API

Node.js/Express REST API for the Stratos course aggregation platform.

## Features

- ✅ CRUD operations for courses
- ✅ Advanced search and filtering
- ✅ Pagination support
- ✅ Spark-based course recommendations
- ✅ Data synchronization from external sources (Coursera, Udacity)
- ✅ MariaDB/MySQL database integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `env.example` to `.env` and configure:
```bash
cp env.example .env
```

Edit `.env` with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=spark
PORT=3000
```

3. Make sure your MariaDB database is set up (run `maria_database.sql`)

## Running the Server

### Development (with auto-reload):
```bash
npm run dev
```

### Production:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in `.env`)

## API Endpoints

### Courses

#### List Courses
```
GET /courses?page=1&limit=10&search=keyword&level=Beginner&source=coursera&category=AI
```
Query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in title and summary
- `level` - Filter by level (Beginner, Intermediate, Advanced, All Levels, Unknown)
- `source` - Filter by source name
- `category` - Filter by category name

#### Get Course Details
```
GET /courses/:id
```

#### Get Similar Courses (Spark Recommendations)
```
GET /courses/:id/similar?limit=5
```

#### Create Course
```
POST /courses
Content-Type: application/json

{
  "source_id": 1,
  "source_course_id": "unique-id",
  "title": "Course Title",
  "summary": "Course description",
  "language_": "English",
  "level_": "Beginner",
  "url": "https://example.com",
  "categories": ["AI", "Machine Learning"],
  "keywords": ["python", "data-science"]
}
```

#### Update Course
```
PUT /courses/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "level_": "Intermediate",
  "categories": ["AI", "Deep Learning"]
}
```

#### Delete Course
```
DELETE /courses/:id
```

### Sync

#### Sync from Specific Source
```
POST /sync/coursera
POST /sync/udacity
```

#### Sync All Sources
```
POST /sync/all
```

### Spark ML Endpoints

#### Get Courses Data for Spark
```
GET /spark/courses?limit=100&offset=0
```
Returns courses with all related data in a format suitable for Spark ML processing.

#### Get User Interactions for Collaborative Filtering
```
GET /spark/interactions
```
Returns user ratings and interactions for Spark ML collaborative filtering.

#### Update Course Similarities (from Spark ML)
```
POST /spark/similarities
Content-Type: application/json

{
  "similarities": [
    {
      "course_id": 1,
      "similar_course_id": 2,
      "score": 0.95
    },
    {
      "course_id": 1,
      "similar_course_id": 3,
      "score": 0.87
    }
  ]
}
```
Updates the `course_similarities` table with Spark ML computed similarity scores.

### Health Check
```
GET /health
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... }  // Only for list endpoints
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error message"
}
```

## Integration with Python Harvesters

The `/sync/:source` endpoint triggers the corresponding Python harvester script:
- `/sync/coursera` → runs `harvesters/coursera_harvester.py`
- `/sync/udacity` → runs `harvesters/udacity_harvester.py`

Make sure Python is installed and accessible in your PATH.

## Database Schema

The API connects to a MariaDB/MySQL database with the following main tables:
- `courses` - Course information
- `sources` - External data sources
- `categories` - Course categories
- `keywords` - Search keywords
- `course_similarities` - Spark ML similarity scores
- `user_interactions` - User ratings and interactions

See `maria_database.sql` for the complete schema.

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js       # Database connection
├── controllers/
│   └── courseController.js  # Course business logic
├── routes/
│   ├── courses.js        # Course routes
│   └── sync.js           # Sync routes
├── services/
│   └── harvesterService.js  # Python harvester integration
├── server.js             # Express server
├── package.json
├── .env.example
└── README.md
```

## Notes

- The similar courses endpoint (`/courses/:id/similar`) uses the `course_similarities` table populated by Spark ML. If no Spark data is available, it falls back to keyword-based similarity.
- The sync endpoints execute Python scripts as child processes. Ensure Python and required packages are installed.
- All database operations use parameterized queries to prevent SQL injection.

