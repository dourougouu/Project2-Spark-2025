from pyspark.sql import SparkSession
from pyspark.sql.functions import col, concat_ws, lower, regexp_replace
from pyspark.ml import Pipeline
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF
from pyspark.ml.clustering import KMeans

#Spark session
spark = SparkSession.builder \
    .appName("Open Courses – Spark ML Pipeline") \
    .config("spark.jars.packages", "com.mysql:mysql-connector-j:8.3.0") \
    .getOrCreate()

#MySQL connection parameters
MYSQL_URL = "jdbc:mysql://localhost:3306/spark?useSSL=false&serverTimezone=UTC"

MYSQL_PROPS = {
    "user": "root",
    "password": "",
    "driver": "com.mysql.cj.jdbc.Driver"
}


#Load data from MySQL(XAMPP)
courses_df = spark.read \
    .format("jdbc") \
    .option("url", MYSQL_URL) \
    .option(
        "dbtable",
        """
        (SELECT
            c.course_id,
            c.title,
            c.summary AS description,
            c.level_ AS level,
            GROUP_CONCAT(cat.name_of_the_category SEPARATOR ' ') AS categories
         FROM courses c
         LEFT JOIN course_categories cc ON c.course_id = cc.course_id
         LEFT JOIN categories cat ON cc.category_id = cat.category_id
         GROUP BY c.course_id
        ) AS courses_with_categories
        """
    ) \
    .option("user", MYSQL_PROPS["user"]) \
    .option("password", MYSQL_PROPS["password"]) \
    .load()

#Text preprocessing
courses_df = courses_df.fillna("")

courses_df = courses_df.withColumn(
    "text",
    concat_ws(" ", "title", "description", "categories", "level")
)

courses_df = courses_df.withColumn("text", lower(col("text")))
courses_df = courses_df.withColumn(
    "text",
    regexp_replace(col("text"), "[^a-zA-Z ]", " ")
)

#TF-IDF
pipeline = Pipeline(stages=[
    Tokenizer(inputCol="text", outputCol="tokens"),
    StopWordsRemover(inputCol="tokens", outputCol="filtered_tokens"),
    HashingTF(
        inputCol="filtered_tokens",
        outputCol="raw_features",
        numFeatures=10000
    ),
    IDF(inputCol="raw_features", outputCol="features")
])

pipeline_model = pipeline.fit(courses_df)
ml_df = pipeline_model.transform(courses_df)

#KMeans Clustering
kmeans = KMeans(
    k=6,
    seed=42,
    featuresCol="features",
    predictionCol="cluster_id"
)

cluster_model = kmeans.fit(ml_df)
result_df = cluster_model.transform(ml_df)

#Export results for API
clusters_df = result_df.select(
    "course_id",
    "cluster_id"
)

clusters_df.write \
    .mode("overwrite") \
    .format("jdbc") \
    .option("url", MYSQL_URL) \
    .option("dbtable", "course_clusters") \
    .option("user", MYSQL_PROPS["user"]) \
    .option("password", MYSQL_PROPS["password"]) \
    .save()



print("Spark ML Pipeline completed successfully")
spark.stop()

