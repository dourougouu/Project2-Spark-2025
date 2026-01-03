"""
Base harvester class providing common functionality for all harvesters
"""

import mysql.connector
from mysql.connector import Error
from typing import Dict, Optional, List
try:
    from .config import DB_CONFIG, SOURCES_CONFIG
except ImportError:
    from config import DB_CONFIG, SOURCES_CONFIG


class BaseHarvester:
    """Base class for all data harvesters"""
    
    def __init__(self, source_name: str):
        """
        Initialize the harvester
        
        Args:
            source_name: Name of the source ('coursera' or 'udacity')
        """
        self.source_name = source_name
        self.source_config = SOURCES_CONFIG.get(source_name)
        if not self.source_config:
            raise ValueError(f"Unknown source: {source_name}")
        
        self.connection = None
        self.source_id = None
    
    def connect_db(self):
        """Establish database connection"""
        try:
            self.connection = mysql.connector.connect(**DB_CONFIG)
            if self.connection.is_connected():
                print(f"Connected to MariaDB database '{DB_CONFIG['database']}'")
                return True
        except Error as e:
            print(f"Error connecting to MariaDB: {e}")
            return False
    
    def disconnect_db(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("Database connection closed")
    
    def get_or_create_source(self) -> Optional[int]:
        """
        Get source_id from database or create new source entry
        
        Returns:
            source_id if successful, None otherwise
        """
        if not self.connection:
            print("Database connection not established")
            return None
        
        cursor = self.connection.cursor()
        
        try:
            # Check if source exists
            cursor.execute(
                "SELECT source_id FROM sources WHERE name = %s",
                (self.source_config['name'],)
            )
            result = cursor.fetchone()
            
            if result:
                self.source_id = result[0]
                print(f"Found existing source: {self.source_config['name']} (ID: {self.source_id})")
            else:
                # Create new source
                cursor.execute(
                    "INSERT INTO sources (name, url_link, type_) VALUES (%s, %s, %s)",
                    (self.source_config['name'], self.source_config['url_link'], self.source_config['type_'])
                )
                self.connection.commit()
                self.source_id = cursor.lastrowid
                print(f"Created new source: {self.source_config['name']} (ID: {self.source_id})")
            
            cursor.close()
            return self.source_id
            
        except Error as e:
            print(f"Error getting/creating source: {e}")
            cursor.close()
            return None
    
    def normalize_level(self, level: str) -> str:
        """
        Normalize level string to match database ENUM values
        
        Args:
            level: Level string from source data
            
        Returns:
            Normalized level matching ENUM: 'Beginner', 'Intermediate', 'Advanced', 'All Levels', 'Unknown'
        """
        if not level:
            return 'Unknown'
        
        level_lower = level.lower().strip()
        
        # Mapping for different level representations
        level_mapping = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'advanced': 'Advanced',
            'mixed': 'All Levels',
            'all levels': 'All Levels',
            'all': 'All Levels'
        }
        
        return level_mapping.get(level_lower, 'Unknown')
    
    def insert_course(self, course_data: Dict) -> Optional[int]:
        """
        Insert or update a course in the database
        
        Args:
            course_data: Dictionary containing course information
            
        Returns:
            course_id if successful, None otherwise
        """
        if not self.connection or not self.source_id:
            print("Database connection or source_id not available")
            return None
        
        cursor = self.connection.cursor()
        
        try:
            # Check if course already exists
            cursor.execute(
                "SELECT course_id FROM courses WHERE source_id = %s AND source_course_id = %s",
                (self.source_id, course_data['source_course_id'])
            )
            result = cursor.fetchone()
            
            if result:
                # Update existing course
                course_id = result[0]
                cursor.execute(
                    """UPDATE courses 
                       SET title = %s, summary = %s, language_ = %s, level_ = %s, url = %s, last_updated = %s
                       WHERE course_id = %s""",
                    (
                        course_data.get('title'),
                        course_data.get('summary'),
                        course_data.get('language_'),
                        course_data.get('level_'),
                        course_data.get('url'),
                        course_data.get('last_updated'),
                        course_id
                    )
                )
                self.connection.commit()
                print(f"Updated course: {course_data.get('title', 'Unknown')} (ID: {course_id})")
            else:
                # Insert new course
                cursor.execute(
                    """INSERT INTO courses 
                       (source_id, source_course_id, title, summary, language_, level_, url, last_updated)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        self.source_id,
                        course_data['source_course_id'],
                        course_data.get('title'),
                        course_data.get('summary'),
                        course_data.get('language_'),
                        course_data.get('level_'),
                        course_data.get('url'),
                        course_data.get('last_updated')
                    )
                )
                self.connection.commit()
                course_id = cursor.lastrowid
                print(f"Inserted course: {course_data.get('title', 'Unknown')} (ID: {course_id})")
            
            cursor.close()
            return course_id
            
        except Error as e:
            print(f"Error inserting/updating course: {e}")
            self.connection.rollback()
            cursor.close()
            return None
    
    def harvest(self):
        """
        Main harvest method - to be implemented by subclasses
        """
        raise NotImplementedError("Subclasses must implement the harvest method")

