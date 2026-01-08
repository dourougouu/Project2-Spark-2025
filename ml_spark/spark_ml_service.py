from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF
from pyspark.ml.clustering import KMeans
from pyspark.ml import Pipeline
import numpy as np
from pyspark.sql.functions import col

# 1. Δημιουργία Spark Session
spark = SparkSession.builder \
    .appName("Course_ML_Pipeline") \
    .getOrCreate()

# 2. Φόρτωση του Ενοποιημένου Αποθετηρίου (Βήμα 4.2 & 4.3)
df = spark.read.option("multiLine", "true").json("unified_repository.json")

# 3. Προετοιμασία Δεδομένων (Data Preprocessing - Βήμα 4.4)
tokenizer = Tokenizer(inputCol="summary", outputCol="words")
remover = StopWordsRemover(inputCol="words", outputCol="filtered")

# 4. Vectorization με TF-IDF (Βήμα 4.4.1)
hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=1000)
idf = IDF(inputCol="rawFeatures", outputCol="features")

# 5. Clustering Μαθημάτων με K-Means (Βήμα 4.4.2)
kmeans = KMeans(k=5, seed=1).setFeaturesCol("features").setPredictionCol("cluster_id")

# 6. Δημιουργία και Εκτέλεση Pipeline
pipeline = Pipeline(stages=[tokenizer, remover, hashingTF, idf, kmeans])
model = pipeline.fit(df)
results = model.transform(df)

# 7. Export Αποτελεσμάτων για το API (Βήμα 4.4.3)
# Επιλέγουμε τα απαραίτητα πεδία: Τίτλο, Cluster ID και τα TF-IDF Features (για Similarity)
final_results = results.select("title", "source_course_id", "cluster_id", "features")

# Αποθήκευση σε JSON μορφή που θα διαβάσει το API
final_results.write.mode("overwrite").json("ml_results.json")

print("Το Spark ML Pipeline ολοκληρώθηκε επιτυχώς!")
spark.stop()
