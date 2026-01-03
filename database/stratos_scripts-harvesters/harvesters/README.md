# Data Harvesters / Connectors

Αυτό το package περιέχει scripts/services που φέρνουν δεδομένα από εξωτερικές πηγές (Coursera, Udacity) και τα εισάγουν στη βάση δεδομένων.

## Δομή Αρχείων

```
harvesters/
├── __init__.py              # Package initialization
├── config.py                # Configuration (database, sources, file paths)
├── base_harvester.py        # Base class με κοινή λειτουργικότητα
├── coursera_harvester.py    # Harvester για Coursera (CSV)
├── udacity_harvester.py     # Harvester για Udacity (JSON)
├── run_all_harvesters.py    # Script για εκτέλεση όλων των harvesters
└── README.md                # Αυτό το αρχείο
```

## Εγκατάσταση

1. Εγκαταστήστε τις απαιτούμενες βιβλιοθήκες:
```bash
pip install -r requirements.txt
```

2. Ρυθμίστε τη σύνδεση στη βάση δεδομένων στο `config.py`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Ορίστε το password σας
    'database': 'spark',
    'charset': 'utf8mb4'
}
```

3. Βεβαιωθείτε ότι τα αρχεία δεδομένων (`coursera_courses.csv` και `udacity_courses_j.json`) βρίσκονται στο root directory του project.

## Χρήση

### Εκτέλεση όλων των harvesters

```bash
python harvesters/run_all_harvesters.py
```

### Εκτέλεση μεμονωμένων harvesters

**Coursera:**
```bash
python harvesters/coursera_harvester.py
```

**Udacity:**
```bash
python harvesters/udacity_harvester.py
```

### Χρήση ως Python modules

```python
from harvesters import CourseraHarvester, UdacityHarvester

# Harvest Coursera courses
coursera = CourseraHarvester()
coursera.harvest()

# Harvest Udacity courses
udacity = UdacityHarvester()
udacity.harvest()
```

## Περιγραφή Λειτουργίας

### BaseHarvester

Η βασική κλάση `BaseHarvester` παρέχει:
- Σύνδεση στη βάση δεδομένων
- Δημιουργία/λήψη source entries
- Κανονικοποίηση level values (Beginner, Intermediate, Advanced, All Levels, Unknown)
- Insert/Update courses στη βάση δεδομένων

### CourseraHarvester

- Διαβάζει δεδομένα από CSV αρχείο (`coursera_courses.csv`)
- Μετατρέπει τα δεδομένα ώστε να ταιριάζουν με το database schema
- Χρησιμοποιεί το row index ως `source_course_id`
- Κανονικοποιεί τα difficulty levels (Beginner, Intermediate, Mixed → All Levels)

### UdacityHarvester

- Διαβάζει δεδομένα από JSON αρχείο (`udacity_courses_j.json`)
- Εξάγει course ID από το URL
- Κατασκευάζει summary από description, skills, prerequisites, κλπ
- Κανονικοποιεί τα levels (beginner → Beginner, intermediate → Intermediate, advanced → Advanced)

## Database Schema Mapping

### Sources Table
- `name`: 'Coursera' ή 'Udacity'
- `url_link`: Base URL της πλατφόρμας
- `type_`: 'csv' για Coursera, 'json' για Udacity

### Courses Table
- `source_id`: Foreign key στο sources table
- `source_course_id`: Unique ID από το external repository
- `title`: Τίτλος μαθήματος
- `summary`: Περιγραφή/σύνοψη
- `level_`: Beginner, Intermediate, Advanced, All Levels, Unknown
- `url`: URL του μαθήματος
- `last_updated`: Ημερομηνία τελευταίας ενημέρωσης

## Σημειώσεις

- Τα harvesters ελέγχουν αν ένα course υπάρχει ήδη (βάσει source_id + source_course_id) και κάνουν update αν υπάρχει
- Σε περίπτωση error, τα harvesters συνεχίζουν με το επόμενο course
- Progress indicators εμφανίζονται κάθε 50 courses
- Στο τέλος εμφανίζεται summary με τον αριθμό courses που εισήχθησαν/ενημερώθηκαν

## Troubleshooting

**Σφάλμα σύνδεσης στη βάση:**
- Ελέγξτε ότι η MariaDB είναι running
- Ελέγξτε τα credentials στο `config.py`
- Ελέγξτε ότι η βάση 'spark' υπάρχει

**File not found:**
- Βεβαιωθείτε ότι τα CSV/JSON αρχεία βρίσκονται στο root directory
- Ελέγξτε τα paths στο `config.py`

**Encoding errors:**
- Τα scripts χρησιμοποιούν UTF-8 encoding
- Αν υπάρχουν προβλήματα, ελέγξτε την κωδικοποίηση των αρχείων

