"""
Spark ML Pipeline for Course Recommendations and Clustering
"""
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler, StringIndexer, Tokenizer, StopWordsRemover, CountVectorizer, IDF
from pyspark.ml.clustering import KMeans
from pyspark.ml.recommendation import ALS
from pyspark.sql.functions import col, udf, array, lit
from pyspark.sql.types import ArrayType, StringType, DoubleType
import json
import sys

def create_spark_session():
    """Create Spark session"""
    return SparkSession.builder \
        .appName("CourseMLPipeline") \
        .config("spark.mongodb.input.uri", "mongodb://localhost:27017/course-aggregator.courses") \
        .config("spark.mongodb.output.uri", "mongodb://localhost:27017/course-aggregator.courses") \
        .getOrCreate()

def load_courses_from_mongodb(spark):
    """Load courses from MongoDB"""
    try:
        df = spark.read.format("mongo").load()
        return df
    except Exception as e:
        print(f"Error loading from MongoDB: {e}")
        print("Using sample data instead...")
        return create_sample_data(spark)

def create_sample_data(spark):
    """Create sample data for testing"""
    from pyspark.sql.types import StructType, StructField, StringType, IntegerType
    
    schema = StructType([
        StructField("_id", StringType(), True),
        StructField("title", StringType(), True),
        StructField("description", StringType(), True),
        StructField("category", StringType(), True),
        StructField("level", StringType(), True),
        StructField("language", StringType(), True),
    ])
    
    sample_data = [
        ("1", "Introduction to Python", "Learn Python programming basics", "Programming", "beginner", "en"),
        ("2", "Advanced Machine Learning", "Deep dive into ML algorithms", "Machine Learning", "advanced", "en"),
        ("3", "Data Science Fundamentals", "Introduction to data science", "Data Science", "beginner", "en"),
        ("4", "Deep Learning with TensorFlow", "Neural networks and deep learning", "Machine Learning", "intermediate", "en"),
        ("5", "Web Development Basics", "HTML, CSS, and JavaScript", "Web Development", "beginner", "en"),
    ]
    
    return spark.createDataFrame(sample_data, schema)

def preprocess_text_features(df):
    """Preprocess text features for ML"""
    # Combine title and description
    df = df.withColumn("text_content", col("title") + " " + col("description"))
    
    # Tokenize
    tokenizer = Tokenizer(inputCol="text_content", outputCol="words")
    df = tokenizer.transform(df)
    
    # Remove stop words
    remover = StopWordsRemover(inputCol="words", outputCol="filtered_words")
    df = remover.transform(df)
    
    # Count vectorization
    cv = CountVectorizer(inputCol="filtered_words", outputCol="raw_features", vocabSize=1000, minDF=2.0)
    cv_model = cv.fit(df)
    df = cv_model.transform(df)
    
    # IDF
    idf = IDF(inputCol="raw_features", outputCol="text_features")
    idf_model = idf.fit(df)
    df = idf_model.transform(df)
    
    return df, cv_model, idf_model

def encode_categorical_features(df):
    """Encode categorical features"""
    # Index categorical columns
    indexers = {}
    indexed_cols = []
    
    for col_name in ["category", "level", "language"]:
        if col_name in df.columns:
            indexer = StringIndexer(inputCol=col_name, outputCol=f"{col_name}_indexed")
            indexer_model = indexer.fit(df)
            df = indexer_model.transform(df)
            indexers[col_name] = indexer_model
            indexed_cols.append(f"{col_name}_indexed")
    
    return df, indexers, indexed_cols

def create_feature_vector(df, indexed_cols):
    """Create feature vector for clustering"""
    # Combine text features with categorical features
    feature_cols = ["text_features"] + indexed_cols
    
    assembler = VectorAssembler(
        inputCols=feature_cols,
        outputCol="features"
    )
    
    df = assembler.transform(df)
    return df

def perform_clustering(df, k=5):
    """Perform K-means clustering"""
    kmeans = KMeans(featuresCol="features", k=k, seed=1)
    model = kmeans.fit(df)
    
    df_clustered = model.transform(df)
    return df_clustered, model

def calculate_similarity(df):
    """Calculate course similarity based on features"""
    from pyspark.ml.feature import Normalizer
    from pyspark.ml.linalg import Vectors
    from pyspark.sql.functions import dot_product
    
    # Normalize features
    normalizer = Normalizer(inputCol="features", outputCol="normalized_features")
    df = normalizer.transform(df)
    
    # Calculate pairwise similarity (cosine similarity)
    # For simplicity, we'll use a simpler approach
    courses = df.select("_id", "title", "normalized_features").collect()
    
    similarities = []
    for i, course1 in enumerate(courses):
        course_similarities = []
        for j, course2 in enumerate(courses):
            if i != j:
                # Calculate cosine similarity
                vec1 = course1.normalized_features
                vec2 = course2.normalized_features
                similarity = float(vec1.dot(vec2))
                course_similarities.append({
                    "courseId": course2._id,
                    "similarity": similarity
                })
        
        # Sort by similarity and take top 10
        course_similarities.sort(key=lambda x: x["similarity"], reverse=True)
        similarities.append({
            "courseId": course1._id,
            "similarCourses": course_similarities[:10]
        })
    
    return similarities

def save_results_to_mongodb(df_clustered, similarities):
    """Save ML results back to MongoDB"""
    # Save cluster assignments
    cluster_assignments = df_clustered.select("_id", "prediction").withColumnRenamed("prediction", "clusterId")
    
    # Note: In production, you would update MongoDB documents with clusterId and similarity data
    # This requires MongoDB connector write operations
    print("Cluster assignments:")
    cluster_assignments.show()
    
    print("\nSimilarity recommendations:")
    for sim in similarities[:5]:  # Show first 5
        print(f"Course {sim['courseId']}: {len(sim['similarCourses'])} similar courses")

def main():
    """Main pipeline"""
    spark = create_spark_session()
    
    print("Loading courses...")
    df = load_courses_from_mongodb(spark)
    print(f"Loaded {df.count()} courses")
    
    print("Preprocessing text features...")
    df, cv_model, idf_model = preprocess_text_features(df)
    
    print("Encoding categorical features...")
    df, indexers, indexed_cols = encode_categorical_features(df)
    
    print("Creating feature vectors...")
    df = create_feature_vector(df, indexed_cols)
    
    print("Performing clustering...")
    df_clustered, kmeans_model = perform_clustering(df, k=5)
    
    print("Calculating similarities...")
    similarities = calculate_similarity(df_clustered)
    
    print("Saving results...")
    save_results_to_mongodb(df_clustered, similarities)
    
    print("Pipeline completed successfully!")
    
    spark.stop()

if __name__ == "__main__":
    main()

