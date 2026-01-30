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
 * [4] POST /sync/:source (Trigger harvesting) 
 */
app.post('/api/sync/:source', (req, res) => {
    const source = req.params.source;
    
    // Χρησιμοποιούμε path που "ανεβαίνει" ένα επίπεδο και μπαίνει στον ml spark
    // Το ".." σημαίνει πήγαινε πίσω, το "ml\ spark" είναι ο φάκελος
    const command = `python "../ml\ spark/v0.3_harvester.py"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
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


/**
 * [6] GET /analytics (Comprehensive Analytics) 
 */
app.get('/api/analytics', (req, res) => {
    // Query για συνολικά μαθήματα
    const totalQuery = "SELECT COUNT(*) as total FROM courses";
    
    // Query για μαθήματα ανά πηγή
    const bySourceQuery = `
        SELECT s.name as source_name, COUNT(c.course_id) as count
        FROM courses c
        JOIN sources s ON c.source_id = s.source_id
        GROUP BY s.name
        ORDER BY count DESC
    `;
    
    // Query για μαθήματα ανά επίπεδο
    const byLevelQuery = `
        SELECT level_, COUNT(*) as count
        FROM courses
        GROUP BY level_
        ORDER BY count DESC
    `;
    
    // Query για μαθήματα ανά γλώσσα
    const byLanguageQuery = `
        SELECT 
            COALESCE(NULLIF(language_, ''), 'Unknown') as language_,
            COUNT(*) as count
        FROM courses
        GROUP BY language_
        ORDER BY count DESC
    `;
    
    // Query για μαθήματα ανά κατηγορία
    const byCategoryQuery = `
        SELECT cat.name_of_the_category as category_name, COUNT(cc.course_id) as count
        FROM categories cat
        LEFT JOIN course_categories cc ON cat.category_id = cc.category_id
        GROUP BY cat.category_id
        HAVING count > 0
        ORDER BY count DESC
    `;
    
    // Query για πρόσφατες ενημερώσεις
    const recentUpdatesQuery = `
        SELECT c.title, c.last_updated, c.level_, s.name as source_name
        FROM courses c
        JOIN sources s ON c.source_id = s.source_id
        WHERE c.last_updated IS NOT NULL
        ORDER BY c.last_updated DESC
        LIMIT 10
    `;

    // Εκτέλεση όλων των queries παράλληλα
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(totalQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results[0].total);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(bySourceQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(byLevelQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(byLanguageQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(byCategoryQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        }),
        new Promise((resolve, reject) => {
            db.query(recentUpdatesQuery, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        })
    ])
    .then(([totalCourses, bySource, byLevel, byLanguage, byCategory, recentUpdates]) => {
        res.json({
            totalCourses,
            bySource,
            byLevel,
            byLanguage,
            byCategory,
            recentUpdates
        });
    })
    .catch(err => {
        console.error('Analytics query error:', err);
        res.status(500).json({ error: 'Failed to fetch analytics', details: err.message });
    });
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



