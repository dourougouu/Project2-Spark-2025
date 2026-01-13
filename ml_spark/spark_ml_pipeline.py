from pyspark.sql import SparkSession
from pyspark.sql.functions import col, concat_ws, lower, regexp_replace
from pyspark.ml import Pipeline
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF
from pyspark.ml.clustering import KMeans


#Spark session
spark = SparkSession.builder \
    .appName("Repositories Machine Learning (ML) Pipeline") \
    .config("spark.jars.packages", "com.mysql:mysql-connector-j:8.3.0") \
    .getOrCreate()

#MySQL connection parameters
mysql_url = "jdbc:mysql://localhost:3306/courses_db?useSSL=false&serverTimezone=UTC"

mysql_properties={
    "user": "root",
    "password": "",
    "driver": "com.mysql.cj.jdbc.Driver"
}
#Load data from MySQL(XAMPP)
mysql_df = spark.read.jdbc(url=mysql_url, table="repositories", properties=mysql_properties)

#Load data from CSV file
csv_df = spark.read.csv("data/coursera_courses.csv", header=True, inferSchema=True)

csv_df = csv_df.select(
    col("course_title").alias("title"),
    col("course_organization").alias("organization"),
    col("course_difficulty").alias("level"),
    col("course_rating").alias("rating"),
    col("course_students_enrolled").alias("students")
)


#Load data from JSON file
json_df = spark.read.json("data/udacity_courses_j.json")

json_df = json_df.select(
    col("Title").alias("title"),
    col("Type").alias("organization"),
    col("Level").alias("level"),
    col("Rating").alias("rating"),
    col("Skills Covered").alias("skills"),
    col("Description").alias("description")
)

#normalize MySQL columns 
mysql_df = mysql_df.select(
    col("title"),
    col("organization"),
    col("level"),
    col("rating"),
    col("description")
)

#Union all data
final_df = mysql_df.unionByName(csv_df, allowMissingColumns=True) \
                   .unionByName(json_df, allowMissingColumns=True)


#Text preprocessing
final_df = final_df.fillna("")

final_df = final_df.withColumn("text", concat_ws(" ", col("title"),
                                                      col("description"),
                                                      col("skills"),
                                                      col("organization"),
                                                      col("level")))

final_df = final_df.withColumn("text", lower(col("text")))
final_df = final_df.withColumn("text", regexp_replace(col("text"), "[^a-zA-Z ]", " "))


#TF-IDF
pipeline = Pipeline(stages=[
    Tokenizer(inputCol="text", outputCol="tokens"),
    StopWordsRemover(inputCol="tokens", outputCol="filtered"),
    HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=10000),
    IDF(inputCol="rawFeatures", outputCol="features")
])

pipeline_model = pipeline.fit(final_df)
ml_df = pipeline_model.transform(final_df)


#KMeans Clustering
kmeans = KMeans(featuresCol="features", predictionCol="cluster", k=6, seed=42)

result = kmeans.fit(ml_df).transform(ml_df)


#Export results for API
result.select("title", "organization", "level", "rating", "cluster") \
      .write.mode("overwrite").parquet("export/courses_clusters.parquet")

result.select("title", "cluster") \
      .write.mode("overwrite").json("export/courses_clusters.json")

print("Spark ML Pipeline completed successfully (MySQL-XAMPP)")
spark.stop()