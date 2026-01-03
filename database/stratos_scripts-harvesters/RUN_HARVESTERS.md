# Οδηγίες Εκτέλεσης Harvesters

## Βήμα 1: Εγκατάσταση Dependencies

```bash
pip install -r requirements.txt
```

## Βήμα 2: Ρύθμιση Database Credentials

Ανοίξτε το αρχείο `harvesters/config.py` και ορίστε το password της MariaDB:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password_here',  # Ορίστε το password σας
    'database': 'spark',
    'charset': 'utf8mb4'
}
```

**Σημαντικό:** Βεβαιωθείτε ότι:
- Η MariaDB/MySQL είναι running
- Η βάση `spark` έχει δημιουργηθεί (τρέξτε το `maria_database.sql` αν δεν το έχετε κάνει ήδη)

## Βήμα 3: Εκτέλεση

### Επιλογή 1: Τρέξτε όλους τους harvesters μαζί

```bash
python harvesters/run_all_harvesters.py
```

### Επιλογή 2: Τρέξτε κάθε harvester ξεχωριστά

**Coursera:**
```bash
python harvesters/coursera_harvester.py
```

**Udacity:**
```bash
python harvesters/udacity_harvester.py
```

## Τι περιμένετε να δείτε

Κατά την εκτέλεση, θα δείτε:
- Μηνύματα σύνδεσης στη βάση
- Progress indicators κάθε 50 courses
- Summary στο τέλος με τον αριθμό courses που εισήχθησαν/ενημερώθηκαν

**Παράδειγμα Output:**
```
Connected to MariaDB database 'spark'
Created new source: Coursera (ID: 1)
Inserted course: AI For Everyone (ID: 1)
Inserted course: Machine Learning (ID: 2)
...
Processed 50 courses...
...
Harvest completed!
Total courses processed: 893
  - New courses inserted: 893
  - Existing courses updated: 0
  - Errors: 0
```

## Troubleshooting

**Σφάλμα: "Access denied for user"**
- Ελέγξτε τα credentials στο `config.py`
- Βεβαιωθείτε ότι ο χρήστης έχει δικαιώματα στη βάση `spark`

**Σφάλμα: "Unknown database 'spark'"**
- Τρέξτε πρώτα το `maria_database.sql` για να δημιουργήσετε τη βάση

**Σφάλμα: "FileNotFoundError"**
- Βεβαιωθείτε ότι τα αρχεία `coursera_courses.csv` και `udacity_courses_j.json` βρίσκονται στο root directory

**Σφάλμα: "ModuleNotFoundError"**
- Τρέξτε `pip install -r requirements.txt` για να εγκαταστήσετε τις βιβλιοθήκες

