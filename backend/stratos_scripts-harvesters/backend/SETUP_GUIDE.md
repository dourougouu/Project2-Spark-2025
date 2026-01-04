# Οδηγός Εγκατάστασης - Backend API

## Προαπαιτούμενα

1. **Node.js** (έκδοση 14 ή νεότερη)
   - Κατεβάστε από: https://nodejs.org/
   - Ελέγξτε την εγκατάσταση: `node --version`

2. **MariaDB/MySQL** (ήδη έχεις phpMyAdmin)
   - Βεβαιώσου ότι η βάση δεδομένων `spark` υπάρχει
   - Βεβαιώσου ότι οι πίνακες έχουν δημιουργηθεί (τρέξε το `maria_database.sql`)

3. **Python** (για τους harvesters)
   - Χρειάζεται για το `/sync` endpoint

## Βήματα Εγκατάστασης

### 1. Άνοιξε Terminal/PowerShell και πήγαινε στο φάκελο backend

```bash
cd backend
```

### 2. Εγκατάστησε τα dependencies

```bash
npm install
```

Αυτό θα κατεβάσει όλα τα απαραίτητα packages (Express, MySQL2, κτλ.)

### 3. Ρύθμισε το αρχείο .env

Δημιούργησε ένα αρχείο `.env` στο φάκελο `backend` με το παρακάτω περιεχόμενο:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=το_password_σου
DB_NAME=spark

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Σημαντικά:**
- `DB_HOST`: Συνήθως `localhost` αν τρέχεις το phpMyAdmin τοπικά
- `DB_PORT`: Συνήθως `3306` (ή `3307` αν χρησιμοποιείς XAMPP/WAMP)
- `DB_USER`: Συνήθως `root` (ή ο χρήστης που έχεις στον phpMyAdmin)
- `DB_PASSWORD`: Το password που χρησιμοποιείς στο phpMyAdmin (άφησε κενό αν δεν έχεις password: `DB_PASSWORD=`)
- `DB_NAME`: `spark` (το όνομα της βάσης)
- `PORT`: Η θύρα που θα τρέχει το API (π.χ. 3000)

**Πώς βρίσκω τα credentials μου:**
- Άνοιξε το phpMyAdmin
- Κάνε login
- Τα στοιχεία που χρησιμοποιείς για login είναι τα ίδια

### 4. Ελέγξε ότι η βάση δεδομένων είναι έτοιμη

- Άνοιξε phpMyAdmin
- Βεβαιώσου ότι υπάρχει η βάση `spark`
- Βεβαιώσου ότι οι πίνακες έχουν δημιουργηθεί:
  - `courses`
  - `sources`
  - `categories`
  - `keywords`
  - `course_categories`
  - `course_keywords`
  - `course_similarities`
  - `users`
  - `user_interactions`

Αν δεν υπάρχουν, τρέξε το SQL script: `maria_database.sql`

### 5. Τρέξε το Server

#### Development mode (με auto-reload):
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

### 6. Ελέγξε ότι τρέχει

Θα πρέπει να δεις στο terminal:
```
============================================================
🚀 Stratos Course Aggregation API Server
============================================================
📡 Server running on http://localhost:3000
📚 Database: spark
🌐 Environment: development
============================================================
```

### 7. Δοκίμασε το API

Άνοιξε browser και πήγαινε στο:
```
http://localhost:3000
```

Θα πρέπει να δεις JSON με τις διαθέσιμες endpoints.

Ή δοκίμασε:
```
http://localhost:3000/health
```

Για να δεις αν η βάση είναι συνδεδεμένη.

## Τιμές σε Περίπτωση Προβλήματος

### Σφάλμα σύνδεσης με βάση δεδομένων:

1. **Ελέγξε ότι το MariaDB/MySQL τρέχει**
   - Αν χρησιμοποιείς XAMPP/WAMP: άνοιξε το control panel και ξεκίνησε το MySQL

2. **Ελέγξε τα credentials στο .env**
   - Δοκίμασε να συνδεθείς στο phpMyAdmin με τα ίδια στοιχεία

3. **Ελέγξε ότι η βάση `spark` υπάρχει**
   - Άνοιξε phpMyAdmin και δες αν υπάρχει η βάση

4. **Ελέγξε το port**
   - Αν το MySQL τρέχει σε διαφορετικό port (π.χ. 3307), πρόσθεσε στο .env:
     ```env
     DB_PORT=3307
     ```

### Σφάλμα "Cannot find module":

```bash
cd backend
npm install
```

### Το server δεν ξεκινά:

- Ελέγξε αν το port 3000 είναι ήδη σε χρήση
- Άλλαξε το PORT στο .env σε κάτι άλλο (π.χ. 3001)

## Χρήσιμα Endpoints για Δοκιμή

1. **Health Check:**
   ```
   GET http://localhost:3000/health
   ```

2. **List Courses:**
   ```
   GET http://localhost:3000/courses?page=1&limit=10
   ```

3. **Course Details:**
   ```
   GET http://localhost:3000/courses/1
   ```

4. **Sync από Coursera:**
   ```
   POST http://localhost:3000/sync/coursera
   ```

## Χρήση με Postman ή cURL

### Δοκίμασε το API με cURL (στο PowerShell):

```powershell
# Health check
curl http://localhost:3000/health

# Get courses
curl http://localhost:3000/courses

# Sync from coursera
curl -X POST http://localhost:3000/sync/coursera
```

### Με Postman:

1. Άνοιξε Postman
2. Δημιούργησε νέο Request
3. Επέλεξε GET/POST
4. Βάλε URL: `http://localhost:3000/courses`
5. Κάνε Send

## Επόμενα Βήματα

Μόλις το backend τρέχει, μπορείς να:
1. Τρέξεις harvesters μέσω API: `POST /sync/coursera` ή `/sync/udacity`
2. Δεις τα courses: `GET /courses`
3. Αναζητήσεις courses: `GET /courses?search=python`
4. Φιλτράρεις: `GET /courses?level=Beginner&source=coursera`

