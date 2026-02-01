<h1><SPARK PROJECT - Course Aggregator Platform</h1>

# Γενική Περιγραφή και Οδηγίες Εγκατάστασης

## 📋 Overview

<p>Το συγκεκριμένο project είναι ένα Spark project. Πρόκειται για μια οριζόντια πλατφορμα συγκέντρωσης διαδικτυακών <br>
μαθημάτων, η οποία συλλέγει, επεξεργάζεται και προτείνει μαθήματα από πολλαπλές εκπαιδευτικές πλατφόρμες , <br>
αξιοποιώντας React, Node.js και Apache Spark ML</p>

## 🎯 Features

<p>
-> Multi-source Aggregation: Udacity and Coursera courses<br>
-> Advanced Search: Φιλτράρουμε την αναζήτηση των courses με βάση: γλώσσα|επίπεδο|πηγή|κατηγορία<br>
-> Machine Learning(ML) για recommendations: Παίρνουμε προτεινόμενα μαθήματα με βάση την ομοιότητα των courses<br>
   Υλοποιήθηκε με cosine similarity|TF-IDF|K-Means<br>
-> Analytics dashboard: Οπτικοποίηση στατιστικών δεδομένων<br>
</p>

## 🏛 Αρχιτεκτονική

Η αρχιτεκτονική του project βασιζεται σε modular και επεκτάσιμη προσέγγιση, με διαχωρισμό ευθυνών μεταξύ<br>
frontend, backend, data processing και machine learning(ML)<br>
<p><ol>
<li><b><h2>FRONTEND (React)</h2></b></li>
Η υλοποίηση έγινε με React και επικοινωνεί με το backend μέσω REST APIs. Παρέχει:<br>
•Αναζήτηση και φιλτράρισμα μαθημάτων<br>
•Προβολή προτάσεων μαθημάτων<br>
•Analytics dashboard με χρήση στατιστικών<br>
<li><b><h2>BACKEND API (Node.js)</h2></b></li>
Η υλοποίηση έγινε με Node.js και ουσιαστικά λειτουργεί ως ενδιάμεσος μεταξύ frontend-data layer<br>
Γενικα:<br>
•Ενοποιεί τα δεδομένα από Udacity και Coursera<br>
•Παρέχει endpoints για:<br>
‣Αναζήτηση μαθημάτων<br>
‣Προτάσεις μαθημάτων<br>
‣Στατιστικά<br>
<li><b><h2>DATA PROCESSING & ML LAYER (Apache Spark)</h2></b></li>
Χρήση του Apache Spark για μαζική επεξεργασία(προεπεξεργασία) δεδομένων, feature extraction(summaries, categories, level)<br>
καθώς και για υπολογισμό ομοιότητας μαθημάτων. Επίσης, χρήση του Spark για vectorization (TF-IDF/embeddings) και cosine similarity<br>
για τα recommendations<br>
<li><b><h2>DATA STORAGE</h2></b></li>
Χρήση της MySQL βάσης δεδομένων, μέσω της χρήσης Xampp. Εκεί, κάνουμε την αποθήκευση των δεδομένων (μαθήματα, αποτελέσματα ML, ...)<br>
<li><b><h2>DATA INGESTION</h2></b></li>
Χρήση scheduled jobs για:<br>
•Ανάκτηση νέων μαθημάτων από APIs<br>
•Ενημέρωση υπάρχοντων δεδομένων<br>
</ol>
</p>

# 💻 Εγκατάσταση

### Θα χρειαστούν τα παρακάτω versions:

    -Node.js v24.12.0
    -Python 3.11.6
    -MySQL + Xampp
    -Java 11.0.29
    -Git

### Database Setup

    Στο Xampp control panel, κάνουμε start τα modules: Apache και MySQL
    Έπειτα ανοίγουμε έναν web browser και μεταβαίνουμε στην σελίδα:
    http://localhost/phpmyadmin/
    Φτιάχνουμε μια νέα database με όνομα spark και εισάγουμε τον κώδικα
    που υπάρχει στο αρχείο:
    v1.0_database.sql

### Backend Setup

    Ανοίγουμε terminal στον φάκελο backend/ και τρέχουμε:
    npm install express mysql2 cors dotenv (ή απλά npm install)
    node v1.0_server.js
      ->Έλεγχος: ανοίγουμε το web browser στο http://127.0.0.1:5001/api/courses
    και αφήνουμε το terminal να τρέχει στο background

### Harvester Setup

    Ανοίγουμε άλλο terminal στον φάκελο ml_spark/ και τρέχουμε:
    python v1.0_harvester.py
      ->Έλεγχος: 1. Πρέπει να έχει δημιουργηθεί στον φάκελο ml_spark/ το αρχείο: unified_repository.json
                 2. Μεταβαίνουμε στην βάση δεδομένων και πρέπει να έχει γίνει εισαγωγή στον πίνακα courses
                 (http://localhost/phpmyadmin/index.php?route=/sql&pos=0&db=spark&table=courses)

### Spark Setup

    Στο ίδιο terminal για το harvester (ml_spark/) τρέχουμε:
    pip install pyspark
    python v1.0_spark_ml_service.py
      ->Έλεγχος: 1. Πρέπει να έχει δημιουργηθεί στον φάκελο ml_spark/ ο φάκελος: ml_results.json
                 2. Μεταβαίνουμε στην βάση δεδομένων και πρέπει να έχει γίνει εισαγωγή στον πίνακα course_similarities
                 (http://localhost/phpmyadmin/index.php?route=/sql&pos=0&db=spark&table=course_similarities)

### Frontend Setup

    Ανοίγουμε άλλο terminal στον φάκελο frontend/ και τρέχουμε:
    npm run dev  (ή npm start)
      ->Έλεγχος: 1.Πρέπει στο terminal να βγάζει κάτι σαν: ➜  Local:   http://localhost:5173/
                 2.Ανοίγουμε το web browser στο http://localhost:5173/ και πρέπει να εμφανίζεται η ιστοσελίδα μας

# 🌐 API Endpoints (Backend)
Το backend μας παρέχει τα παρακάτω endpoints:
<b><h3>METHOD        ENDPOINT                         ΠΕΡΙΓΡΑΦΗ</h3></b><br>
<p>     GET          /api/courses                     Λίστα μαθημάτων <br></p>
<p>     GET          /api/courses/:id                 Λεπτομέριες μαθήματος <br></p>
<p>     GET          /api/courses/:id/similar         Παρόμοια μαθήματα <br></p>
<p>     GET          /api/analytics                   Στατιστικά μαθημάτων <br></p>
<p>     GET          /api/filters                     Διαθέσιμα φίλτρα <br></p>

## 👥 Συμμετέχοντες  
<ul>
<li>Βενετσάνου Αναστασία</li>
<li>Δρούγκα Μαρία</li>
<li>Πασσάκου Βασιλική</li>
<li>Χατζηδούκας Ευστράτιος</li>
</ul>

