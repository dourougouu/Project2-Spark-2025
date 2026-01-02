import pandas as pd
import json
import mysql.connector
from datetime import datetime

# 1. ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΒΑΣΗ ΣΟΥ (XAMPP Default)
def connect_to_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # Στο XAMPP το password είναι συνήθως κενό
        database="spark"
    )

# 2. ΜΕΤΑΣΧΗΜΑΤΙΣΜΟΣ ΓΙΑ ΤΟ ΕΝΙΑΙΟ ΣΧΗΜΑ (4.2 της εκφώνησης)
def transform_row(raw_data, source_id, source_type):
    # Λίστα αποδεκτών τιμών για το ENUM της βάσης σου
    valid_levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels']
    
    if source_type == 'coursera':
        level = str(raw_data.get('course_difficulty', 'Unknown')).capitalize()
        if level not in valid_levels: level = 'Unknown'
        
        return (
            source_id,
            str(raw_data.get('Unnamed: 0')), # source_course_id
            str(raw_data.get('course_title'))[:255],
            f"Org: {raw_data.get('course_organization')}, Rating: {raw_data.get('course_rating')}",
            "English",
            level,
            "https://www.coursera.org",
            datetime.now().strftime("%Y-%m-%d")
        )
    
    elif source_type == 'udacity':
        level = str(raw_data.get('Level', 'Unknown')).capitalize()
        if level not in valid_levels: level = 'Unknown'
        
        return (
            source_id,
            str(raw_data.get('URL'))[:255], # source_course_id
            str(raw_data.get('Title'))[:255],
            str(raw_data.get('Description')),
            "English",
            level,
            str(raw_data.get('URL'))[:255],
            datetime.now().strftime("%Y-%m-%d")
        )

# 3. ΚΥΡΙΟΣ HARVESTER
def run_harvester():
    try:
        db = connect_to_db()
        cursor = db.cursor()
        print("Σύνδεση με τη MariaDB επιτυχής!")

        # SQL INSERT (Χρησιμοποιούμε INSERT IGNORE για να μην έχουμε διπλότυπα)
        sql = """INSERT IGNORE INTO courses 
                 (source_id, source_course_id, title, summary, language_, level_, url, last_updated) 
                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""

        # Φόρτωση Coursera (CSV)
        print("Επεξεργασία Coursera CSV...")
        df_c = pd.read_csv('coursera_courses.csv')
        for _, row in df_c.iterrows():
            cursor.execute(sql, transform_row(row, 1, 'coursera'))

        # Φόρτωση Udacity (JSON)
        print("Επεξεργασία Udacity JSON...")
        with open('udacity_courses_j.json', 'r', encoding='utf-8') as f:
            u_data = json.load(f)
            for item in u_data:
                cursor.execute(sql, transform_row(item, 2, 'udacity'))

        db.commit()
        print(f"Ολοκληρώθηκε! Πήγαινε στο phpMyAdmin να δεις τα δεδομένα στον πίνακα 'courses'.")
        
    except mysql.connector.Error as err:
        print(f"Σφάλμα: {err}")
    finally:
        if 'db' in locals() and db.is_connected():
            cursor.close()
            db.close()

if __name__ == "__main__":
    run_harvester()
