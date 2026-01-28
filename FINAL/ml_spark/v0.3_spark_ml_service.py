from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF
from pyspark.ml.clustering import KMeans
from pyspark.ml import Pipeline
import numpy as np
from pyspark.sql.functions import col, concat_ws, udf 
from pyspark.ml.linalg import VectorUDT 

# 1. Δημιουργία Spark Session
spark = SparkSession.builder \
    .appName("Course_ML_Pipeline") \
    .config("spark.jars.packages", "com.mysql:mysql-connector-j:8.0.33") \
    .getOrCreate()

# 2. Φόρτωση του Ενοποιημένου Αποθετηρίου (Βήμα 4.2 & 4.3)
df = spark.read.option("multiLine", "true").json("unified_repository.json")

df = df.fillna({"summary": "", "title": ""}) #αν summary=null να μην μας βγαλει error στο tokenizer

df = df.withColumn("full_text", concat_ws(" ", df["title"], df["summary"]))

# 3. Προετοιμασία Δεδομένων (Data Preprocessing - Βήμα 4.4)
tokenizer = Tokenizer(inputCol="full_text", outputCol="words")
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

# 7. Υπολογισμός ομοιότητας courses με χρήση του cosine similarity
def cosine_similarity(v1, v2):
    #μετατροπη των sparse vectors του sparkσε numpy arrays
    arr1 = v1.toArray()
    arr2 = v2.toArray()
    denom = (np.linalg.norm(arr1)*np.linalg.norm(arr2))
    return float(np.dot(arr1, arr2)/denom) if denom != 0 else 0.0

    # Δημιουργία του πίνακα similarity
    # ουσιαστικά παιρνουμε ολα τα ζευγαρια μαθηματων που ανηκουν στο ιδιο cluster
    course_data = results.select("course_id", "features", "cluster_id").collect()
    similarity_list = []

    for i in range(len(course_data)):
        for j in range(i+1, len(course_data)):
            if course_data[i]['cluster_id'] == course_data[j]['cluster_id']:
                score = cosine_similarity(course_data[i]['features'], course_data[j]['features'])
                if score > 0.3:
                    similarity_list.append((int(course_data[i]['course_id']), int(course_data[j]['course_id']), score))
                    similarity_list.append((int(course_data[j]['course_id']), int(course_data[i]['course_id']), score))

#Μετατροπη σε DataFrame
similarity_df = spark.createDataFrame(similarity_list, ["course_id", "similar_course_id", "score"])

# 8. Export Αποτελεσμάτων για το API (Βήμα 4.4.3)
# Επιλέγουμε τα απαραίτητα πεδία: Τίτλο, Cluster ID και τα TF-IDF Features (για Similarity)
results.select("title", "course_id", "cluster_id").write.mode("overwrite").json("ml_results.json")

# 9. Αποθήκευση και στην sql
database_url = "jdbc:mysql://127.0.0.1:3308/spark"
db_properties = {
    'user': 'root',
    'password': '',       
    'driver': 'com.mysql.cj.jdbc.Driver'
}

print("Αποθήκευση αποτελεσμάτων στη βάση δεδομένων...")
similarity_df.write.jdbc(url=db_url, table="course_similarities", mode="overwrite", properties=db_properties)

print("Το Spark ML Pipeline και ο υπολογισμός Similarity ολοκληρώθηκαν!")
spark.stop()


