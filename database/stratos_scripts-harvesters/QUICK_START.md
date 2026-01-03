# Γρήγορη Εκκίνηση

## Όλα είναι έτοιμα! ✅

- ✅ Βάση δεδομένων δημιουργημένη (phpMyAdmin)
- ✅ Config ρυθμισμένο (κενό password για XAMPP)
- ✅ Dependencies εγκατεστημένα

## Εκτέλεση Harvesters

### Επιλογή 1: Double-click στο batch file
Κάντε **double-click** στο `run_harvesters.bat`

### Επιλογή 2: Από Command Prompt
Ανοίξτε **Command Prompt** (cmd) στο directory και τρέξτε:

```cmd
python harvesters\run_all_harvesters.py
```

### Επιλογή 3: Μεμονωμένα
```cmd
python harvesters\coursera_harvester.py
python harvesters\udacity_harvester.py
```

---

## Τι θα συμβεί;

Οι harvesters θα:
1. Συνδεθούν στη βάση `spark`
2. Διαβάσουν τα CSV/JSON αρχεία
3. Εισάγουν/ενημερώσουν τα courses στη βάση
4. Εμφανίσουν progress και summary

**Χρόνος εκτέλεσης:** ~1-2 λεπτά για όλα τα courses

---

## Αν εμφανιστεί error

**"Access denied"** → Ελέγξτε ότι το MySQL τρέχει από το XAMPP Control Panel

**"Module not found"** → Τρέξτε: `pip install mysql-connector-python`

**"File not found"** → Βεβαιωθείτε ότι βρίσκεστε στο σωστό directory

