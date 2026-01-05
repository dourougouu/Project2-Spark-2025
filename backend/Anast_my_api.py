from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# --- ΡΥΘΜΙΣΕΙΣ ΒΑΣΗΣ ---
DB_CONFIG = {
    'user': 'root',
    'password': '',       # Βάλε τον κωδικό σου
    'host': 'localhost',
    'database': 'spark',  # Η βάση σου
    'port': 3306
}

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

# --- 1. ENDPOINT: ΛΙΣΤΑ ΜΑΘΗΜΑΤΩΝ & ΑΝΑΖΗΤΗΣΗ ---
@app.route('/courses', methods=['GET'])
def get_courses():
    query = request.args.get('q', '') 
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        if query:
            search_term = f"%{query}%"
            # Ψάχνουμε στον τίτλο ή στο summary
            sql = """
            SELECT c.course_id, c.title, c.summary, c.level_, c.url, c.last_updated, s.name as source
            FROM courses c
            JOIN sources s ON c.source_id = s.source_id
            WHERE c.title LIKE %s OR c.summary LIKE %s
            LIMIT 50
            """
            cursor.execute(sql, (search_term, search_term))
        else:
            # Τα 20 πιο πρόσφατα
            sql = """
            SELECT c.course_id, c.title, c.level_, c.url, c.last_updated, s.name as source
            FROM courses c
            JOIN sources s ON c.source_id = s.source_id
            ORDER BY c.last_updated DESC
            LIMIT 20
            """
            cursor.execute(sql)
            
        results = cursor.fetchall()
        return jsonify(results)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected(): conn.close()

# --- 2. ENDPOINT: ΛΕΠΤΟΜΕΡΕΙΕΣ ΜΑΘΗΜΑΤΟΣ (Διορθωμένο για Categories & Keywords) ---
@app.route('/course/<int:course_id>', methods=['GET'])
def get_course_details(course_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # A. Βασικά στοιχεία (courses + sources)
        sql = """
        SELECT c.*, s.name as source_name
        FROM courses c
        JOIN sources s ON c.source_id = s.source_id
        WHERE c.course_id = %s
        """
        cursor.execute(sql, (course_id,))
        course = cursor.fetchone()
        
        if not course:
            return jsonify({"error": "Course not found"}), 404
            
        # B. Φέρνουμε τις ΚΑΤΗΓΟΡΙΕΣ (από πίνακα categories & course_categories)
        sql_cats = """
        SELECT cat.name_of_the_category
        FROM categories cat
        JOIN course_categories cc ON cat.category_id = cc.category_id
        WHERE cc.course_id = %s
        """
        cursor.execute(sql_cats, (course_id,))
        # Δημιουργούμε λίστα με τα ονόματα των κατηγοριών
        categories_list = [row['name_of_the_category'] for row in cursor.fetchall()]
        
        # Γ. (Προαιρετικό) Φέρνουμε τα KEYWORDS (από πίνακα keywords & course_keywords)
        # Αν δεν έχεις περάσει keywords ακόμα, αυτό θα επιστρέφει κενή λίστα, που είναι ΟΚ.
        sql_kw = """
        SELECT k.keyword
        FROM keywords k
        JOIN course_keywords ck ON k.keyword_id = ck.keyword_id
        WHERE ck.course_id = %s
        """
        cursor.execute(sql_kw, (course_id,))
        keywords_list = [row['keyword'] for row in cursor.fetchall()]

        # Προσθέτουμε τα αποτελέσματα στο JSON
        course['categories'] = categories_list  # Πλέον λέγεται σωστά 'categories'
        course['keywords'] = keywords_list      # Προσθέσαμε και τα 'keywords'
        
        return jsonify(course)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected(): conn.close()

# --- 3. ENDPOINT: RECOMMENDATIONS (Βάσει course_similarities) ---
@app.route('/recommendations/<int:course_id>', methods=['GET'])
def get_recommendations(course_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Εδώ διαβάζουμε τον πίνακα course_similarities
        sql = """
        SELECT c.course_id, c.title, c.level_, c.url, sim.score
        FROM course_similarities sim
        JOIN courses c ON sim.similar_course_id = c.course_id
        WHERE sim.course_id = %s
        ORDER BY sim.score DESC
        LIMIT 5
        """
        cursor.execute(sql, (course_id,))
        recommendations = cursor.fetchall()
        
        return jsonify(recommendations)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if 'conn' in locals() and conn.is_connected(): conn.close()

# --- 4. DELETE: ΔΙΑΓΡΑΦΗ ΜΑΘΗΜΑΤΟΣ (ΝΕΟ) ---
@app.route('/course/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Έλεγχος: Υπάρχει το μάθημα;
        cursor.execute("SELECT title FROM courses WHERE course_id = %s", (course_id,))
        course = cursor.fetchone()
        
        if not course:
            return jsonify({"error": "Course not found"}), 404

        title_deleted = course[0]

        # 2. ΚΑΘΑΡΙΣΜΟΣ ΕΞΑΡΤΗΣΕΩΝ (Cascade Delete)
        # Πρέπει πρώτα να σβήσουμε τις συνδέσεις στους άλλους πίνακες
        cursor.execute("DELETE FROM course_categories WHERE course_id = %s", (course_id,))
        cursor.execute("DELETE FROM course_keywords WHERE course_id = %s", (course_id,))
        cursor.execute("DELETE FROM course_similarities WHERE course_id = %s OR similar_course_id = %s", (course_id, course_id))
        
        # Αν υπάρχει πίνακας user_interactions (προαιρετικό)
        cursor.execute("DELETE FROM user_interactions WHERE course_id = %s", (course_id,))

        # 3. ΤΕΛΙΚΗ ΔΙΑΓΡΑΦΗ
        cursor.execute("DELETE FROM courses WHERE course_id = %s", (course_id,))
        
        conn.commit()
        print(f"🗑️ Deleted course: {title_deleted} (ID: {course_id})")
        
        return jsonify({"message": f"Course '{title_deleted}' deleted successfully"}), 200

    except Exception as e:
        if conn: conn.rollback() # Ακύρωση αν γίνει λάθος
        return jsonify({"error": str(e)}), 500
    finally:
        if conn and conn.is_connected(): conn.close()

if __name__ == '__main__':
    print("🚀 Server is running at: http://localhost:5000")
    app.run(debug=True, port=5000)

# εντολές για endpoint
# http://localhost:5000/courses Όλα τα μαθήματα
# http://localhost:5000/course/1 Λεπτομέρειες Μαθήματος με ID 1
# localhost:5000/keywords keywords (κενός για τώρα)
# http://localhost:5000/courses?q=Data ψαχνει στο courses(title, summary) για εγγραφες με την λέξη Data 
# Για Delete πρεπει με αρχειο δες old iterations test_delete.py
