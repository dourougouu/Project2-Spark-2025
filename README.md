# Project2-Spark-2025
<h1><b>Enterprise-grade course aggregator platform with ML-powered recommendations built with React, Node.js, and Apache Spark. University team project for "Decentralized Data Technologies and Algorithms" course. </b></h1>

<h1>Οριζόντιο Repository / Aggregator Ανοικτών Μαθημάτων</h1>

<p><strong>Σύντομη Περιγραφή:</strong> Αυτό το project υλοποιεί ένα οριζόντιο repository που συγκεντρώνει μεταδεδομένα μαθημάτων από πολλαπλά εξωτερικά repositories (MOOCs) και προσφέρει ενιαίο React front-end μαζί με Apache Spark για large-scale data processing και machine learning (π.χ. recommendations, clustering).</p>

<h2>🎯 Σκοπός</h2>
<ul>
  <li>Συγκέντρωση και ενοποίηση μεταδεδομένων μαθημάτων από διάφορες πηγές.</li>
  <li>Προσφορά ενιαίου UI για αναζήτηση, φιλτράρισμα και προβολή μαθημάτων.</li>
  <li>Εφαρμογή Spark jobs για analytics και απλές λειτουργίες ML (similar courses, clustering).</li>
</ul>

<h2>🧰 Τεχνολογίες</h2>
<ul>
  <li><strong>Front-end:</strong> React (Hooks, React Router)</li>
  <li><strong>Back-end / API:</strong> Node.js + Express (ή άλλο, τεκμηριώστε την επιλογή)</li>
  <li><strong>Database:</strong> PostgreSQL / MySQL ή MongoDB</li>
  <li><strong>Big Data & ML:</strong> Apache Spark (Spark SQL, MLlib / PySpark)</li>
  <li><strong>Format:</strong> REST / JSON για interoperability</li>
</ul>

<h2>⚙️ Κύριες Λειτουργίες</h2>
<ul>
  <li>Import / harvesting από ≥2 διαφορετικές πηγές (connectors).</li>
  <li>Ενιαίο σχήμα μαθήματος: τίτλος, σύντομη & αναλυτική περιγραφή, λέξεις-κλειδιά, γλώσσα, επίπεδο, πηγή, link, τελευταία ενημέρωση.</li>
  <li>Front-end: αναζήτηση, φίλτρα (γλώσσα, επίπεδο, πηγή, θεματική), λίστα μαθημάτων, σελίδα λεπτομερειών.</li>
  <li>Spark ML: similarity (TF-IDF + cosine) για "Similar courses" ή clustering μαθημάτων.</li>
  <li>Endpoints (παραδείγματα): <code>/courses</code>, <code>/courses/{id}</code>, <code>/courses/{id}/similar</code>, <code>/sync/{source}</code></li>
</ul>
<h2>👥 Συνεργάτες / Ομάδα</h2>
<ul>
  <li>Βενετσάνου Αναστασία</li>
  <li>Δρούγκα Μαρία</li>
  <li>Πασσάκου Βασιλική</li>
  <li>Χατζηδούκας Ευστράτιος</li>
</ul>
