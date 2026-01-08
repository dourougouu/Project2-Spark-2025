import mysql.connector
import json
import csv
import os
from datetime import datetime

# --- ΡΥΘΜΙΣΕΙΣ ---
DB_CONFIG = { 'user': 'root', 'password': '', 'host': 'localhost', 'database': 'spark' }

# Λίστα που θα μαζεύει όλα τα μαθήματα για το ενιαίο JSON 
unified_data_for_spark = []

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_or_create_source(cursor, name, type_):
    cursor.execute("SELECT source_id FROM sources WHERE name = %s", (name,))
    res = cursor.fetchone()
    if res: return res[0]
    cursor.execute("INSERT INTO sources (name, type_) VALUES (%s, %s)", (name, type_))
    return cursor.lastrowid

def upsert_course_safe(cursor, source_id, source_course_id, title, summary, url, level, categories):
    if not title: return

    # Μετατροπή Level για το ENUM
    valid_levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
    final_level = 'Unknown'
    if level:
        for lvl in valid_levels:
            if lvl.lower() in level.lower():
                final_level = lvl
                break

    # 1. Αποθήκευση στη MySQL (Βήμα 2)
    sql = """INSERT INTO courses (source_id, source_course_id, title, summary, level_, url, last_updated)
             VALUES (%s, %s, %s, %s, %s, %s, NOW())
             ON DUPLICATE KEY UPDATE 
             title=VALUES(title), summary=VALUES(summary), level_=VALUES(level_), last_updated=NOW()"""
    try:
        cursor.execute(sql, (source_id, str(source_course_id), title, summary, final_level, url))
        
        # 2. Αποθήκευση στη λίστα για το ενιαίο JSON 
        unified_data_for_spark.append({
            "source_id": source_id,
            "source_course_id": str(source_course_id),
            "title": title,
            "summary": summary if summary else title,
            "level_": final_level,
            "url": url,
            "last_updated": datetime.now().strftime("%Y-%m-%d")
        })
        
        # Κατηγορίες (Normalization)
        cursor.execute("SELECT course_id FROM courses WHERE source_id=%s AND source_course_id=%s", (source_id, str(source_course_id)))
        db_course_id = cursor.fetchone()[0]
        
        for cat in categories:
            cat = cat.strip()[:150]
            if cat:
                cursor.execute("SELECT category_id FROM categories WHERE name_of_the_category=%s", (cat,))
                res = cursor.fetchone()
                cat_id = res[0] if res else None
                
                if not cat_id:
                    cursor.execute("INSERT IGNORE INTO categories (name_of_the_category) VALUES (%s)", (cat,))
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
            title = row.get('course_title')
            c_id = row.get('') 
            if not c_id: c_id = title
            desc = title 
            url = f"https://coursera.org/search?query={title.replace(' ', '%20')}"
            level = row.get('course_difficulty')
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
        data = json.load(f)

    conn = get_connection(); cursor = conn.cursor()
    sid = get_or_create_source(cursor, "Udacity", "json")
    
    count = 0
    for item in data:
        title = item.get('Title')
        c_id = item.get('URL') 
        if not c_id: c_id = title 
        desc = item.get('Description')
        url = item.get('URL')
        level = item.get('Level')
        skills_str = item.get('Skills Covered', "")
        cats = skills_str.split(',') if skills_str else []
        
        upsert_course_safe(cursor, sid, c_id, title, desc, url, level, cats)
        count += 1

    conn.commit(); conn.close()
    print(f"✅ Udacity Done. ({count} courses)")

if __name__ == "__main__":
    # Εκτέλεση των Harvesters
    process_coursera()
    process_udacity()

    # Δημιουργία του ενιαίου αρχείου JSON για το Spark 
    print("\n--- ΔΗΜΙΟΥΡΓΙΑ ΕΝΙΑΙΟΥ ΑΠΟΘΕΤΗΡΙΟΥ (JSON) ---")
    with open('unified_repository.json', 'w', encoding='utf-8') as f:
        json.dump(unified_data_for_spark, f, ensure_ascii=False, indent=4)
    print(f"✅ Το αρχείο 'unified_repository.json' δημιουργήθηκε με {len(unified_data_for_spark)} εγγραφές.")
