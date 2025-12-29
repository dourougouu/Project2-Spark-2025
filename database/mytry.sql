-- DROP DATABASE  mysparkproject;

CREATE DATABASE mysparkproject;

CREATE TABLE providers(
    provider_id int NOT NULL AUTO_INCREMENT,
    p_name varchar(100) NOT NULL, 
    website_url varchar(255) NOT NULL,
    PRIMARY KEY (provider_id)
);

CREATE TABLE users (
    user_id int NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at datetime default CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE Courses(
    course_id int NOT NULL AUTO_INCREMENT,
    title varchar(100) NOT NULL,
    summary TEXT, 
    category varchar(50) NOT NULL,
    c_language varchar(50) NOT NULL,
    c_level ENUM('Beginner','Intermediate','Advanced','All Levels') default 'All Levels',
    source varchar(100) NOT NULL,
    link varchar(100) NOT NULL,
    last_updated datetime default CURRENT_TIMESTAMP,
    provider_id int NOT NULL,
    PRIMARY KEY (course_id),
    CONSTRAINT fk_provider 
        FOREIGN KEY (provider_id) REFERENCES providers(provider_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE user_interactions(
    interaction_id int NOT NULL AUTO_INCREMENT,
    user_id int NOT NULL,
    course_id int NOT NULL,
    rating FLOAT CHECK (rating >= 1 AND rating <= 5), 
    interaction_date datetime default CURRENT_TIMESTAMP,
    PRIMARY KEY (interaction_id),
    CONSTRAINT fk_user 
        FOREIGN KEY(user_id) REFERENCES users(user_id) 
        ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_course 
        FOREIGN KEY(course_id) REFERENCES courses(course_id) 
        ON UPDATE CASCADE ON DELETE CASCADE
);