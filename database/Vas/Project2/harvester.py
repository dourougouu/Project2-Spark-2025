import json
import csv
from datetime import datetime

# --- ΣΥΝΑΡΤΗΣΗ ΜΕΤΑΣΧΗΜΑΤΙΣΜΟΥ (Mapping) ---
def transform(data, source_name):
    # Εδώ υλοποιούμε το "Ενιαίο Σχήμα" (Βήμα 4.2 της εκφώνησης)
    return {
        "title": data.get("title") or data.get("CourseName"),
        "description": data.get("desc") or data.get("Summary"),
        "subject_area": data.get("category") or data.get("Topic"),
        "language": data.get("lang", "Greek"),
        "level": data.get("level") or data.get("Difficulty"),
        "source_name": source_name,
        "url": data.get("link"),
        "last_updated": datetime.now().strftime("%Y-%m-%d")
    }

# --- CONNECTOR ΓΙΑ ΠΗΓΗ Α (JSON) ---
def harvest_source_a():
    print("Reading from Source A (JSON file)...")
    with open('source_A.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        return [transform(item, "Repository A") for item in data]

# --- CONNECTOR ΓΙΑ ΠΗΓΗ Β (CSV) ---
def harvest_source_b():
    print("Reading from Source B (CSV file)...")
    courses = []
    with open('source_B.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            courses.append(transform(row, "Repository B"))
    return courses

# --- ΚΥΡΙΟΣ ΣΥΓΧΡΟΝΙΣΜΟΣ (Full Import) ---
def run_sync():
    # 1. Μάζεμα από Πηγή Α
    repo_a = harvest_source_a()
    
    # 2. Μάζεμα από Πηγή Β
    repo_b = harvest_source_b()
    
    # 3. Ένωση στο Ενιαίο Repository (Aggregation)
    unified_data = repo_a + repo_b
    
    # Αποθήκευση του τελικού "καθαρού" αρχείου για το Spark
    with open('unified_repository.json', 'w', encoding='utf-8') as f:
        json.dump(unified_data, f, ensure_ascii=False, indent=4)
    
    print(f"Success! Συνολικά {len(unified_data)} μαθήματα στο Ενιαίο Repository.")

if __name__ == "__main__":
    run_sync()