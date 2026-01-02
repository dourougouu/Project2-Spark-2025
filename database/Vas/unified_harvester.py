import pandas as pd
import json
import mysql.connector
from datetime import datetime

# 1. ΣΥΝΔΕΣΗ ΜΕ ΤΗ ΒΑΣΗ ΣΟΥ
def connect_to_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",        # Βάλε το δικό σου username
        password="password", # Βάλε το δικό σου password
        database="spark"     # Το όνομα από το maria_database.sql
    )

# 2. ΜΕΤΑΣΧΗΜΑΤΙΣΜΟΣ (Mapping βάσει των πεδίων σου)
def transform(raw_data, source_id, source_type):
    if source_type == 'coursera':
        # Κανονικοποίηση Level για το ENUM σου
        level = raw_data.get('course_difficulty', 'Unknown')
        if level not in ['Beginner', 'Intermediate', 'Advanced', 'All Levels']:
            level = 'Unknown'
            
        return (
            source_id,
            str(raw_data.get('Unnamed: 0')), # source_course_id
            raw_data.get('course_title')[:255],
            f"Org: {raw_data.get('course_organization')}, Rating: {raw_data.get('course_rating')}", # summary
            "English", # language_
            level,
            "https://www.coursera.org", # url
            datetime.now().strftime("%Y-%m-%d") # last_updated
        )
    elif source_type == 'udacity':
        level = str(raw_data.get('Level', 'Unknown')).capitalize()
        if level not in ['Beginner', 'Intermediate', 'Advanced', 'All Levels']:
            level = 'Unknown'
            
        return (
            source_id,
            raw_data.get('URL')[:255], # source_course_id
            raw_data.get('Title')[:255],
            raw_data.get('Description'),
            "English",
            level,
            raw_data.get('URL')[:255],
            datetime.now().strftime("%Y-%m-%d")
        )

# 3. ΕΚΤΕΛΕΣΗ ΚΑΙ ΕΙΣΑΓΩΓΗ ΣΤΗ ΒΑΣΗ
def run_harvester():
    db = connect_to_db()
    cursor = db.cursor()

    # SQL Ερώτημα βασισμένο στον πίνακα courses του maria_database.sql
    sql = """INSERT IGNORE INTO courses 
             (source_id, source_course_id, title, summary, language_, level_, url, last_updated) 
             VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""

    # --- Πηγή 1: Coursera ---
    print("Harvesting Coursera...")
    df_c = pd.read_csv('coursera_courses.csv')
    for _, row in df_c.iterrows():
        cursor.execute(sql, transform(row, 1, 'coursera'))

    # --- Πηγή 2: Udacity ---
    print("Harvesting Udacity...")
    with open('udacity_courses_j.json', 'r', encoding='utf-8') as f:
        u_data = json.load(f)
        for item in u_data:
            cursor.execute(sql, transform(item, 2, 'udacity'))

    db.commit()
    print(f"Επιτυχία! Εισήχθησαν {cursor.rowcount} νέα μαθήματα στη βάση 'spark'.")
    cursor.close()
    db.close()

if __name__ == "__main__":
    run_harvester()
