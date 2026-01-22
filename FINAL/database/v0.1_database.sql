create database if not exists spark;
USE spark;


-- Περιγράφει τα εξωτερικά repositories (πχ. Coursera, Udemy, edX)
create table sources(
    source_id int NOT NULL AUTO_INCREMENT,
    name varchar(100) NOT NULL,
    url_link varchar(255),   -- το website link ή το api base url
    type_ ENUM('api', 'json', 'csv'),  -- ο τυπος που εισαγουμε τα δεδομενα
    time_created TIMESTAMP default CURRENT_TIMESTAMP,
    PRIMARY KEY(source_id)
);

create table courses(
    course_id int NOT NULL AUTO_INCREMENT,
    source_id int NOT NULL,
    source_course_id varchar(255) NOT NULL,  -- id απο το εξωτερικο repo/χρησιμοποιειται για συγχρονισμο
    title varchar(255),
    summary text,
    language_ varchar(50),
    level_ ENUM('Beginner', 'Intermediate', 'Advanced', 'All Levels', 'Unknown') default 'Unknown',
    url varchar(255),
    last_updated date,   
    time_created TIMESTAMP default CURRENT_TIMESTAMP,
    time_updated TIMESTAMP default CURRENT_TIMESTAMP 
       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(course_id),
    UNIQUE(source_id, source_course_id),   -- ελεγχουμε οτι δεν εισαγεται το ιδιο μαθημα δυο φορες
    FOREIGN KEY (source_id) REFERENCES sources(source_id)
);

-- θεματικες των repositories (πχ AI, Web Development, Data Science)
create table categories(
    category_id int NOT NULL AUTO_INCREMENT,
    name_of_the_category varchar(150) UNIQUE,
    PRIMARY KEY(category_id)
);

-- Γιατι ενα μαθημα μπορει να ανηκει σε πολλες κατηγοριες/θεματικες
create table course_categories(
	 course_id int NOT NULL,
     category_id int NOT NULL,
     PRIMARY KEY (course_id, category_id),
     FOREIGN KEY (course_id) REFERENCES courses(course_id),
     FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

-- λεξεις-κλειδια για αναζητηση και ML επεξεργασια
create table keywords(
     keyword_id int NOT NULL AUTO_INCREMENT,
     keyword varchar(100) UNIQUE,
     PRIMARY KEY(keyword_id)
);


create table course_keywords(
     course_id int NOT NULL,
     keyword_id int NOT NULL,
     PRIMARY KEY (course_id, keyword_id),
     FOREIGN KEY (course_id) REFERENCES courses(course_id),
     FOREIGN KEY (keyword_id) REFERENCES keywords(keyword_id)
);


-- πινακας για καταγραφη χρηστων (ουσιαστικα για personalization και ratings)
create table users(
      user_id int NOT NULL AUTO_INCREMENT,
      username varchar(100) NOT NULL UNIQUE,
      email varchar(100) NOT NULL UNIQUE,
      time_created TIMESTAMP default CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id)
);

-- καταγραφη αξιολογησεων/προβολων (μπορει να αξιοποιηθει απο Spark ML)
create table user_interactions(
      interaction_id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      course_id int NOT NULL,
      rating FLOAT CHECK (rating>=1 AND rating<=5),
      interaction_date TIMESTAMP default CURRENT_TIMESTAMP,
      PRIMARY KEY(interaction_id),
      FOREIGN KEY(user_id) REFERENCES users(user_id),
      FOREIGN KEY(course_id) REFERENCES courses(course_id)
);


-- για αποτελεσμαατα Spark ML (χρησιμο για την συνδεση database με την Spark ML)
create table course_similarities(
	 course_id int,
     similar_course_id int,
     score float,
     PRIMARY KEY (course_id, similar_course_id),
     FOREIGN KEY(course_id) REFERENCES courses(course_id),
     FOREIGN KEY(similar_course_id) REFERENCES courses(course_id)
);
