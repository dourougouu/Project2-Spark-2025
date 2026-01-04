"""
Udacity JSON Harvester
Reads course data from JSON file and inserts into database
"""

import json
from datetime import date
from typing import Dict, List
try:
    from .base_harvester import BaseHarvester
    from .config import DATA_FILES
except ImportError:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from harvesters.base_harvester import BaseHarvester
    from harvesters.config import DATA_FILES


class UdacityHarvester(BaseHarvester):
    """Harvester for Udacity courses from JSON file"""
    
    def __init__(self):
        super().__init__('udacity')
        self.json_file = DATA_FILES['udacity']
    
    def extract_course_id_from_url(self, url: str) -> str:
        """
        Extract course ID from Udacity URL
        
        Args:
            url: Udacity course URL
            
        Returns:
            Course ID string (e.g., 'data-engineer-nanodegree--nd027')
        """
        if not url:
            return ""
        
        # Extract the course slug from URL
        # Example: https://www.udacity.com/course/data-engineer-nanodegree--nd027
        # Result: data-engineer-nanodegree--nd027
        parts = url.strip('/').split('/')
        if parts:
            return parts[-1]
        return ""
    
    def parse_json_course(self, course: Dict, index: int) -> Dict:
        """
        Parse a JSON course object into course data dictionary
        
        Args:
            course: Dictionary containing course JSON data
            index: Index in the list (used as fallback for source_course_id)
            
        Returns:
            Dictionary with course data for database insertion
        """
        title = course.get('Title', '').strip()
        description = course.get('Description', '').strip()
        level = course.get('Level', '').strip()
        duration = course.get('Duration', '').strip()
        skills = course.get('Skills Covered', '').strip()
        prerequisites = course.get('Prerequisites', '').strip()
        url = course.get('URL', '').strip()
        course_type = course.get('Type', '').strip()
        
        # Build comprehensive summary
        summary_parts = []
        if description:
            summary_parts.append(description)
        if course_type:
            summary_parts.append(f"Type: {course_type}")
        if duration:
            summary_parts.append(f"Duration: {duration}")
        if skills:
            summary_parts.append(f"Skills: {skills}")
        if prerequisites:
            summary_parts.append(f"Prerequisites: {prerequisites}")
        
        summary = "\n\n".join(summary_parts) if summary_parts else None
        
        # Extract source_course_id from URL or use index
        source_course_id = self.extract_course_id_from_url(url)
        if not source_course_id:
            source_course_id = f"udacity_{index}"
        
        # Normalize level (capitalize first letter)
        normalized_level = self.normalize_level(level)
        
        return {
            'source_course_id': source_course_id,
            'title': title[:255] if title else None,
            'summary': summary[:65535] if summary else None,
            'language_': None,  # Not explicitly available
            'level_': normalized_level,
            'url': url[:255] if url else None,
            'last_updated': date.today()
        }
    
    def harvest(self):
        """
        Main harvest method - reads JSON and inserts courses into database
        """
        if not self.connect_db():
            return False
        
        if not self.get_or_create_source():
            self.disconnect_db()
            return False
        
        try:
            # Read JSON file
            with open(self.json_file, 'r', encoding='utf-8') as jsonfile:
                courses = json.load(jsonfile)
            
            if not isinstance(courses, list):
                print(f"Error: JSON file should contain an array of courses")
                return False
            
            courses_processed = 0
            courses_inserted = 0
            courses_updated = 0
            errors = 0
            
            for index, course in enumerate(courses):
                try:
                    course_data = self.parse_json_course(course, index)
                    
                    # Skip if title is missing
                    if not course_data.get('title'):
                        continue
                    
                    # Check if course exists before inserting
                    cursor = self.connection.cursor()
                    cursor.execute(
                        "SELECT course_id FROM courses WHERE source_id = %s AND source_course_id = %s",
                        (self.source_id, course_data['source_course_id'])
                    )
                    exists = cursor.fetchone()
                    cursor.close()
                    
                    course_id = self.insert_course(course_data)
                    
                    if course_id:
                        courses_processed += 1
                        if exists:
                            courses_updated += 1
                        else:
                            courses_inserted += 1
                    else:
                        errors += 1
                    
                    # Progress indicator
                    if courses_processed % 50 == 0:
                        print(f"Processed {courses_processed} courses...")
                        
                except Exception as e:
                    print(f"Error processing course {index}: {e}")
                    errors += 1
                    continue
            
            print(f"\nHarvest completed!")
            print(f"Total courses processed: {courses_processed}")
            print(f"  - New courses inserted: {courses_inserted}")
            print(f"  - Existing courses updated: {courses_updated}")
            print(f"  - Errors: {errors}")
            
            return True
            
        except FileNotFoundError:
            print(f"Error: JSON file '{self.json_file}' not found")
            return False
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON file: {e}")
            return False
        except Exception as e:
            print(f"Error during harvest: {e}")
            return False
        finally:
            self.disconnect_db()


if __name__ == "__main__":
    harvester = UdacityHarvester()
    harvester.harvest()

