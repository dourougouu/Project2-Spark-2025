import mysql.connector
import json
import csv
import os

# --- ΡΥΘΜΙΣΕΙΣ ---
DB_CONFIG = { 'user': 'root', 'password': '', 'host': 'localhost', 'database': 'spark' }

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_or_create_source(cursor, name, type_):
    cursor.execute("SELECT source_id FROM sources WHERE name = %s", (name,))
    res = cursor.fetchone()
    if res: return res[0]
    cursor.execute("INSERT INTO sources (name, type_) VALUES (%s, %s)", (name, type_))
    return cursor.lastrowid

def upsert_course_safe(cursor, source_id, source_course_id, title, summary, url, level, categories):
    # Ασφάλεια
    if not title: return

    # Μετατροπή Level για το ENUM
    valid_levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
    final_level = 'Unknown'
    if level:
        for lvl in valid_levels:
            if lvl.lower() in level.lower():
                final_level = lvl
                break

    sql = """INSERT INTO courses (source_id, source_course_id, title, summary, level_, url, last_updated)
             VALUES (%s, %s, %s, %s, %s, %s, NOW())
             ON DUPLICATE KEY UPDATE 
             title=VALUES(title), summary=VALUES(summary), level_=VALUES(level_), last_updated=NOW()"""
    try:
        cursor.execute(sql, (source_id, str(source_course_id), title, summary, final_level, url))
        
        # Κατηγορίες
        cursor.execute("SELECT course_id FROM courses WHERE source_id=%s AND source_course_id=%s", (source_id, str(source_course_id)))
        db_course_id = cursor.fetchone()[0]
        
        for cat in categories:
            cat = cat.strip()[:150] # Καθαρισμός
            if cat:
                # Βρες ή φτιάξε κατηγορία
                cursor.execute("SELECT category_id FROM categories WHERE name_of_the_category=%s", (cat,))
                res = cursor.fetchone()
                cat_id = res[0] if res else None
                
                if not cat_id:
                    cursor.execute("INSERT IGNORE INTO categories (name_of_the_category) VALUES (%s)", (cat,))
                    # Ξαναπάρε το ID γιατί το IGNORE δεν επιστρέφει πάντα lastrowid αν υπάρχει
                    cursor.execute("SELECT category_id FROM categories WHERE name_of_the_category=%s", (cat,))
                    row = cursor.fetchone()
                    if row: cat_id = row[0]
                
                if cat_id:
                    cursor.execute("INSERT IGNORE INTO course_categories (course_id, category_id) VALUES (%s, %s)", (db_course_id, cat_id))
    except Exception as e:
        print(f"   ❌ Error saving '{title}': {e}")

def process_coursera():
    print("\n--- COURSERA PROCESSING ---")
    filename = 'coursera_courses.csv'
    if not os.path.exists(filename): return print("❌ File missing")
    
    conn = get_connection(); cursor = conn.cursor()
    sid = get_or_create_source(cursor, "Coursera", "csv")
    
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            # ΣΩΣΤΟ MAPPING ΜΕ ΒΑΣΗ ΤΟΝ ΕΛΕΓΧΟ ΣΟΥ
            title = row.get('course_title')
            
            # Το ID είναι στην πρώτη κενή στήλη ''
            c_id = row.get('') 
            if not c_id: c_id = title # Fallback αν λείπει το ID

            # Δεν υπάρχει description, βάζουμε τον τίτλο
            desc = title 
            
            # Δεν υπάρχει URL, φτιάχνουμε ένα ψεύτικο για να μην είναι κενό
            url = f"https://coursera.org/search?query={title.replace(' ', '%20')}"
            
            level = row.get('course_difficulty')
            
            # Κατηγορία είναι το Organization
            cats = [row.get('course_organization')] if row.get('course_organization') else []
            
            upsert_course_safe(cursor, sid, c_id, title, desc, url, level, cats)
            count += 1
            
    conn.commit(); conn.close()
    print(f"✅ Coursera Done. ({count} courses)")

def process_udacity():
    print("\n--- UDACITY PROCESSING ---")
    filename = 'udacity_courses_j.json'
    if not os.path.exists(filename): return print("❌ File missing")
    
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f) # Είναι κατευθείαν Λίστα

    conn = get_connection(); cursor = conn.cursor()
    sid = get_or_create_source(cursor, "Udacity", "json")
    
    count = 0
    for item in data:
        # ΣΩΣΤΟ MAPPING ΜΕ ΒΑΣΗ ΤΟΝ ΕΛΕΓΧΟ ΣΟΥ (Κεφαλαία γράμματα)
        title = item.get('Title')
        # Χρησιμοποιούμε το URL ως μοναδικό ID αφού δεν υπάρχει άλλο
        c_id = item.get('URL') 
        if not c_id: c_id = title 

        desc = item.get('Description')
        url = item.get('URL')
        level = item.get('Level')
        
        # Οι δεξιότητες είναι string με κόμματα: "AWS Glue, Amazon S3, ..."
        skills_str = item.get('Skills Covered', "")
        cats = skills_str.split(',') if skills_str else []
        
        upsert_course_safe(cursor, sid, c_id, title, desc, url, level, cats)
        count += 1

    conn.commit(); conn.close()
    print(f"✅ Udacity Done. ({count} courses)")

if __name__ == "__main__":
    process_coursera()
    process_udacity()