import mysql.connector
import json
import csv
import os
import requests
import io # Χρειάζεται για να διάβασμα του CSV που έρχεται από το δίκτυο
from datetime import datetime  # Χρειαζόμαστε αυτό για την ημερομηνία

# --- ΡΥΘΜΙΣΕΙΣ ΒΑΣΗΣ ---
DB_CONFIG = {
    'user': 'root',
    'password': '',       
    'host': 'localhost',
    'database': 'spark',
    'port': 3306
}

# Η λίστα που θα μαζεύει τα δεδομένα για το Spark
unified_data_for_spark = []

# --- URLS GITHUB (ΒΑΣΙΣΜΕΝΑ ΣΤΟ SCREENSHOT ΣΟΥ) ---
# Αυτά είναι τα Raw Links από το repo σου 'dourougouu'
URL_UDACITY = "https://raw.githubusercontent.com/dourougouu/Project2-Spark-2025/main/FINAL/database/udacity_courses_j.json"
URL_COURSERA = "https://raw.githubusercontent.com/dourougouu/Project2-Spark-2025/main/FINAL/database/coursera_courses.csv"

# --- ΣΥΝΑΡΤΗΣΕΙΣ ΒΑΣΗΣ ---
def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_or_create_source(cursor, name, type_):
    cursor.execute("SELECT source_id FROM sources WHERE name = %s", (name,))
    res = cursor.fetchone()
    if res:
        return res[0]
    cursor.execute("INSERT INTO sources (name, type_) VALUES (%s, %s)", (name, type_))
    return cursor.lastrowid

def get_or_create_category(cursor, cat_name):
    if not cat_name: return None
    cat_name = cat_name.strip()[:140]
    cursor.execute("SELECT category_id FROM categories WHERE name_of_the_category = %s", (cat_name,))
    res = cursor.fetchone()
    if res:
        return res[0]
    try:
        cursor.execute("INSERT INTO categories (name_of_the_category) VALUES (%s)", (cat_name,))
        return cursor.lastrowid
    except mysql.connector.Error:
        return None

def upsert_course(cursor, source_id, source_course_id, title, summary, level, url, cats):
    cursor.execute("SELECT course_id FROM courses WHERE source_id=%s AND source_course_id=%s", 
                   (source_id, source_course_id))
    res = cursor.fetchone()
    
    if res:
        c_id = res[0]
        # Update (αν θέλουμε να ενημερώνουμε περιγραφές κτλ)
        cursor.execute("""
            UPDATE courses SET title=%s, summary=%s, level_=%s, url=%s 
            WHERE course_id=%s
        """, (title, summary, level, url, c_id))
    else:
        # Insert
        cursor.execute("""
            INSERT INTO courses (source_id, source_course_id, title, summary, level_, url)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (source_id, source_course_id, title, summary, level, url))
        c_id = cursor.lastrowid

    # Categories Link
    if cats:
        for cat in cats:
            cat_id = get_or_create_category(cursor, cat)
            if cat_id:
                cursor.execute("""
                    INSERT IGNORE INTO course_categories (course_id, category_id) 
                    VALUES (%s, %s)
                """, (c_id, cat_id))

    # Αποθήκευση στη λίστα για το ενιαίο JSON του Spark
    unified_data_for_spark.append({
        "source_id": source_id,
        "source_course_id": str(source_course_id),
        "title": title,
        "summary": summary if summary else title,
        "level_": level,
        "url": url,
        "last_updated": datetime.now().strftime("%Y-%m-%d")
    })
    
    return c_id

# --- LOGIC ΓΙΑ ΤΟ PATHING (ΤΟΠΙΚΑ ΑΡΧΕΙΑ) ---
def get_local_file_path(filename):
    # Βρίσκει πού είναι το script (μέσα στο ml_spark)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # Πάει έναν φάκελο πίσω (..) και μετά στο database
    # Τελικό Path: .../FINAL/database/filename
    return os.path.join(current_dir, '..', 'database', filename)

# --- ΕΠΕΞΕΡΓΑΣΙΑ UDACITY (JSON) ---
def process_udacity():
    print("\n🔍 Processing Udacity...")
    data = None
    
    # 1. Προσπάθεια από GITHUB (REST API Simulation)
    try:
        print(f"📡 Downloading from GitHub: {URL_UDACITY}")
        resp = requests.get(URL_UDACITY)
        if resp.status_code == 200:
            data = resp.json()
            print("Download success!")
        else:
            print(f"⚠️ GitHub returned {resp.status_code}")
    except Exception as e:
        print(f"Network error: {e}")

    # 2. Αν αποτύχει, ψάχνουμε ΤΟΠΙΚΑ στο ../database/
    if not data:
        local_path = get_local_file_path('udacity_courses_j.json')
        print(f"Falling back to local file: {local_path}")
        if os.path.exists(local_path):
            with open(local_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            print("File not found anywhere.")
            return

    # Εισαγωγή στη βάση
    conn = get_connection()
    cursor = conn.cursor()
    sid = get_or_create_source(cursor, "Udacity", "json")
    
    # Χειρισμός δομής JSON
    courses_list = data.get('courses', []) if isinstance(data, dict) else data
    
    count = 0
    for item in courses_list:
        title = item.get('Title') or item.get('title')
        if not title: continue
        
        summary = item.get('Summary') or item.get('summary') or ''
        level = item.get('Level') or item.get('level') or 'Unknown'
        url = item.get('Link') or item.get('search_url') or ''
        
        # Καθαρισμός επιπέδου για να ταιριάζει στο ENUM της βάσης
        if 'beginner' in level.lower(): level = 'Beginner'
        elif 'intermediate' in level.lower(): level = 'Intermediate'
        elif 'advanced' in level.lower(): level = 'Advanced'
        else: level = 'Unknown'

        # Categories (αν υπάρχουν ως string "Business, Tech")
        cats_raw = item.get('affiliates') or '' 
        cats = [c.strip() for c in cats_raw.split(',') if c.strip()]

        upsert_course(cursor, sid, title[:200], title, summary, level, url, cats)
        count += 1
        
    conn.commit()
    conn.close()
    print(f"Udacity: Processed {count} courses.")

# --- ΕΠΕΞΕΡΓΑΣΙΑ COURSERA (CSV) ---
def process_coursera():
    print("\n Processing Coursera...")
    csv_content = None
    
    # 1. Προσπάθεια από GITHUB
    try:
        print(f"Downloading from GitHub: {URL_COURSERA}")
        resp = requests.get(URL_COURSERA)
        if resp.status_code == 200:
            # Μετατρέπουμε το κείμενο σε αρχείο στη μνήμη για το CSV reader
            csv_content = io.StringIO(resp.text)
            print("Download success!")
    except Exception as e:
        print(f"Network error: {e}")

    # 2. Αν αποτύχει, ψάχνουμε ΤΟΠΙΚΑ
    if not csv_content:
        local_path = get_local_file_path('coursera_courses.csv')
        print(f"Falling back to local file: {local_path}")
        if os.path.exists(local_path):
            csv_content = open(local_path, 'r', encoding='utf-8')
        else:
            print("File not found anywhere.")
            return

    # Εισαγωγή στη βάση
    conn = get_connection()
    cursor = conn.cursor()
    sid = get_or_create_source(cursor, "Coursera", "csv")
    
    reader = csv.DictReader(csv_content)
    count = 0
    for row in reader:
        title = row.get('course_title')
        if not title: continue
        
        # Το Coursera CSV δεν έχει unique ID, χρησιμοποιούμε τον τίτλο
        c_id_str = title[:250] 
        summary = "" # Το CSV σου ίσως δεν έχει summary, το αφήνουμε κενό ή βάζουμε τον τίτλο
        level = row.get('course_difficulty', 'Unknown')
        url = row.get('course_url', '')
        
        if 'beginner' in level.lower(): level = 'Beginner'
        elif 'intermediate' in level.lower(): level = 'Intermediate'
        elif 'advanced' in level.lower(): level = 'Advanced'
        else: level = 'Unknown'

        # Skills ως categories
        skills = row.get('course_skills', '')
        cats = [c.strip() for c in skills.split(',') if c.strip()]

        upsert_course(cursor, sid, c_id_str, title, summary, level, url, cats)
        count += 1

    # Αν ανοίξαμε τοπικό αρχείο, πρέπει να το κλείσουμε
    if isinstance(csv_content, io.IOBase) and not isinstance(csv_content, io.StringIO):
        csv_content.close()

    conn.commit()
    conn.close()
    print(f"Coursera: Processed {count} courses.")

if __name__ == "__main__":
    process_udacity()
    process_coursera()



#  Εδώ δημιουργείται  το αρχείο JSON
    print("\n--- ΔΗΜΙΟΥΡΓΙΑ ΕΝΙΑΙΟΥ ΑΠΟΘΕΤΗΡΙΟΥ (JSON) ---")
    with open('unified_repository.json', 'w', encoding='utf-8') as f:
        json.dump(unified_data_for_spark, f, ensure_ascii=False, indent=4)
    print(f"✅ Το αρχείο 'unified_repository.json' δημιουργήθηκε με {len(unified_data_for_spark)} εγγραφές.")
        
    print("\n Harvesting completed!")

#    (oo)   (oo)   (oo)
#    /¥ \   /¥ \   /¥ \
#   _(__)_ _(__)_ _(__)_
#   HARVEST  HARVEST  HARVEST




