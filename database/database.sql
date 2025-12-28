-- PROJECT 2: Aggregator Ανοικτών Μαθημάτων

-- 1. Πίνακας Παρόχων (Repositories/Platforms)
CREATE TABLE providers (
    provider_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    website_url VARCHAR(255)
);

-- 2. Πίνακας Μαθημάτων (Courses)
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,                -- Για το Spark Clustering 
    subject_area VARCHAR(150),       
    language VARCHAR(50),            
    level VARCHAR(50),               
    url VARCHAR(255),                
    provider_id INTEGER NOT NULL,
    
    CONSTRAINT fk_provider 
        FOREIGN KEY(provider_id) 
        REFERENCES providers(provider_id) 
        ON DELETE CASCADE
);

-- 3. Πίνακας Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Πίνακας Αλληλεπιδράσεων (User Interactions)
CREATE TABLE user_interactions (
    interaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    rating FLOAT CHECK (rating >= 1 AND rating <= 5), 
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user 
        FOREIGN KEY(user_id) 
        REFERENCES users(user_id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_course 
        FOREIGN KEY(course_id) 
        REFERENCES courses(course_id) 
        ON DELETE CASCADE
);
