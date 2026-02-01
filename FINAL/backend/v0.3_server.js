const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { exec } = require('child_process'); 
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Σύνδεση με τη βάση
const db = mysql.createConnection({
    host: '127.0.0.1', 
    user: 'root',
    password: '',
    database: 'spark',
    port: 3306
});

db.connect((err) => {
    if (err) console.error('❌ DB Connection Error:', err);
    else console.log('✅ Connected to Database!');
});

// --- ENDPOINTS ---

/**
 * [0] GET /filters
 */
app.get('/api/filters', (req, res) => {
    const filters = {
        languages: [],
        levels: ['Beginner', 'Intermediate', 'Advanced'],
        sources: [],
        categories: []
    };

     db.query("SELECT DISTINCT language_ FROM courses WHERE language_ IS NOT NULL AND language_ != ''", (err, languageResults) => {
        if (err) {
            console.error('Error fetching languages:', err);
            filters.languages = ['English', 'Spanish']; // fallback
        } else {
            // Μετατροπή των αποτελεσμάτων σε πίνακα τιμών
            filters.languages = languageResults.map(row => row.language_).filter(lang => lang);
        }

        db.query("SELECT source_id, name FROM sources", (err, sources) => {
           if (err) return res.status(500).json(err);
           filters.sources = sources;

           db.query("SELECT category_id, name_of_the_category FROM categories", (err2, categories) => {
               if (err2) return res.status(500).json(err2);
               filters.categories = categories;
               res.json(filters);
            });
        });
     });
});

/**
 * [1] GET /courses
 */
app.get('/api/courses', (req, res) => {
    let { page = 1, limit = 10, search, level, source, language, category } = req.query;
    let offset = (page - 1) * limit;
    
    let query = "SELECT DISTINCT c.*, s.name as source_name FROM courses c JOIN sources s ON c.source_id = s.source_id";
    
    if (category) {
        query += " JOIN course_categories cc ON c.course_id = cc.course_id";
    }
    
    query += " WHERE 1=1";
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
    // ΔΙΟΡΘΩΣΗ 1: Χρήση του language_ ΚΑΙ εδώ για σιγουριά
    if (language) {
        query += " AND c.language_ = ?";
        params.push(language);
    }
    if (category) {
        query += " AND cc.category_id = ?";
        params.push(parseInt(category));
    }

    let countQuery = query.replace("SELECT DISTINCT c.*, s.name as source_name", "SELECT COUNT(DISTINCT c.course_id) as total");
    
    db.query(countQuery, params, (err, countResult) => {
        if (err) return res.status(500).json(err);
        
        const total = countResult[0]?.total || 0;
        
        query += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        db.query(query, params, (err, results) => {
            if (err) return res.status(500).json(err);
            res.json({
                courses: results,
                total: total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        });
    });
});

/**
 * [2] GET /courses/{id}
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
 * [3] GET /courses/{id}/similar
 * Αν course_similarities είναι κενός, επιστρέφουμε μαθήματα από την ίδια κατηγορία (fallback).
 */
app.get('/api/courses/:id/similar', (req, res) => {
    const courseId = req.params.id;
    const fromTable = `
        SELECT c.* FROM courses c
        JOIN course_similarities cs ON c.course_id = cs.similar_course_id
        WHERE cs.course_id = ?
        ORDER BY cs.score DESC
        LIMIT 5`;

    db.query(fromTable, [courseId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results && results.length > 0) return res.json(results);

        // Fallback: παρόμοια = ίδια κατηγορία (όταν course_similarities κενός)
        const fallback = `
            SELECT DISTINCT c.* FROM courses c
            JOIN course_categories cc ON c.course_id = cc.course_id
            WHERE cc.category_id IN (
                SELECT category_id FROM course_categories WHERE course_id = ?
            ) AND c.course_id != ?
            LIMIT 5`;
        db.query(fallback, [courseId, courseId], (err2, fallbackResults) => {
            if (err2) return res.status(500).json(err2);
            res.json(fallbackResults || []);
        });
    });
});

/**
 * [4] GET /analytics
 */
app.get('/api/analytics', async (req, res) => {
    try {
        const queries = {
            totalCourses: "SELECT COUNT(*) as count FROM courses",
            bySource: "SELECT s.name as source_name, COUNT(*) as count FROM courses c JOIN sources s ON c.source_id = s.source_id GROUP BY s.name",
            byCategory: "SELECT cat.name_of_the_category as category_name, COUNT(*) as count FROM course_categories cc JOIN categories cat ON cc.category_id = cat.category_id GROUP BY cat.name_of_the_category",
            byLevel: "SELECT level_, COUNT(*) as count FROM courses GROUP BY level_",
            
            // ΔΙΟΡΘΩΣΗ 2: Χρήση του language_ (με underscore)
            byLanguage: "SELECT language_ as language_, COUNT(*) as count FROM courses GROUP BY language_",
            
            recentUpdates: "SELECT c.title, s.name as source_name, c.level_, c.last_updated FROM courses c JOIN sources s ON c.source_id = s.source_id ORDER BY c.last_updated DESC LIMIT 5"
        };

        const executeQuery = (sql) => new Promise((resolve, reject) => {
            db.query(sql, (err, result) => err ? reject(err) : resolve(result));
        });

        const [total, sources, categories, levels, languages, recent] = await Promise.all([
            executeQuery(queries.totalCourses),
            executeQuery(queries.bySource),
            executeQuery(queries.byCategory),
            executeQuery(queries.byLevel),
            executeQuery(queries.byLanguage),
            executeQuery(queries.recentUpdates)
        ]);

        res.json({
            totalCourses: total[0].count,
            bySource: sources,
            byCategory: categories,
            byLevel: levels,
            byLanguage: languages,
            recentUpdates: recent
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
});

/**
 * [5] GET /sync/:source
 */
app.post('/api/sync/:source', (req, res) => {
    const source = req.params.source;
    const command = `python "../ml spark/v0.4_harvester.py"`; 

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ message: "Sync failed", error: error.message });
        }
        res.json({ message: `Sync completed for ${source}`, output: stdout });
    });
});

/**
 * [6] Spark Data Serving
 */
app.get('/api/internal/spark-data', (req, res) => {
    db.query("SELECT course_id, title, summary FROM courses", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// --- SERVER LISTEN ON PORT 5001 ---
const PORT = 5001; 
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Server running explicitly on http://127.0.0.1:${PORT}`));





