"""
Configuration file for database connection and harvester settings
"""

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'your_password',  # Set your password here
    'database': 'spark',
    'charset': 'utf8mb4'
}

# Source configurations
SOURCES_CONFIG = {
    'coursera': {
        'name': 'Coursera',
        'url_link': 'https://www.coursera.org',
        'type_': 'csv'
    },
    'udacity': {
        'name': 'Udacity',
        'url_link': 'https://www.udacity.com',
        'type_': 'json'
    }
}

# File paths (relative to project root)
import os
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_FILES = {
    'coursera': os.path.join(PROJECT_ROOT, 'coursera_courses.csv'),
    'udacity': os.path.join(PROJECT_ROOT, 'udacity_courses_j.json')
}

