const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { exec } = require('child_process'); // Για το triggering του harvester
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Σύνδεση με τη βάση 'spark' 
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spark'
});

// --- ENDPOINTS ---

/**
 * [1] GET /courses (List, Filters, Pagination) 
 */
app.get('/api/courses', (req, res) => {
    let { page = 1, limit = 10, search, level, source } = req.query;
    let offset = (page - 1) * limit;
    
    let query = "SELECT c.*, s.name as source_name FROM courses c JOIN sources s ON c.source_id = s.source_id WHERE 1=1";
    let params = [];

    if (search) {
        query += " AND (c.title LIKE ? OR c.summary LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }
    if (level) {
        query += " AND c.level_ = ?";
        params.push(level);
    }
    if (source) {
        query += " AND s.name = ?";
        params.push(source);
    }

    query += " LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

/**
 * [2] GET /courses/{id} (Details)
 */
app.get('/api/courses/:id', (req, res) => {
    const query = `
        SELECT c.*, s.name as source_name, 
        GROUP_CONCAT(cat.name_of_the_category) as categories
        FROM courses c 
        JOIN sources s ON c.source_id = s.source_id
        LEFT JOIN course_categories cc ON c.course_id = cc.course_id
        LEFT JOIN categories cat ON cc.category_id = cat.category_id
        WHERE c.course_id = ?
        GROUP BY c.course_id`;
        
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).send("Course not found");
        res.json(result[0]);
    });
});

/**
 * [3] GET /courses/{id}/similar (Spark-based recommendations) 
 * Διαβάζει από τον πίνακα course_similarities που γεμίζει το Spark 
 */
app.get('/api/courses/:id/similar', (req, res) => {
    const query = `
        SELECT c.* FROM courses c
        JOIN course_similarities cs ON c.course_id = cs.similar_course_id
        WHERE cs.course_id = ?
        ORDER BY cs.score DESC
        LIMIT 5`;

    db.query(query, [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

/**
 * [4] POST /sync/{source} (Trigger harvesting) 
 * Εκτελεί το python script που μας έδωσες 
 */
app.post('/api/sync/:source', (req, res) => {
    const source = req.params.source;
    // Εκτέλεση του harvester script (π.χ. Anast_harvester.py)
    exec(`python Anast_harvester.py`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ message: "Sync failed", error: error.message });
        }
        res.json({ message: `Sync completed for ${source}`, output: stdout });
    });
});

/**
 * [5] Endpoint για Spark jobs (Serving Data) 
 * Επιστρέφει όλα τα μαθήματα (title/summary) για το Vectorization του Spark 
 */
app.get('/api/internal/spark-data', (req, res) => {
    db.query("SELECT course_id, title, summary FROM courses", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

const PORT = 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
