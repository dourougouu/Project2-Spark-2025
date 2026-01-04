"""
Coursera CSV Harvester
Reads course data from CSV file and inserts into database
"""

import csv
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


class CourseraHarvester(BaseHarvester):
    """Harvester for Coursera courses from CSV file"""
    
    def __init__(self):
        super().__init__('coursera')
        self.csv_file = DATA_FILES['coursera']
    
    def parse_csv_row(self, row: Dict, row_index: int) -> Dict:
        """
        Parse a CSV row into course data dictionary
        
        Args:
            row: Dictionary containing CSV row data
            row_index: Row index (used as source_course_id)
            
        Returns:
            Dictionary with course data for database insertion
        """
        # Extract data from CSV
        title = row.get('course_title', '').strip()
        organization = row.get('course_organization', '').strip()
        certificate_type = row.get('course_Certificate_type', '').strip()
        rating = row.get('course_rating', '').strip()
        difficulty = row.get('course_difficulty', '').strip()
        students_enrolled = row.get('course_students_enrolled', '').strip()
        
        # Build summary from available information
        summary_parts = []
        if organization:
            summary_parts.append(f"Organization: {organization}")
        if certificate_type:
            summary_parts.append(f"Certificate Type: {certificate_type}")
        if rating:
            summary_parts.append(f"Rating: {rating}")
        if students_enrolled:
            summary_parts.append(f"Students Enrolled: {students_enrolled}")
        
        summary = ". ".join(summary_parts) if summary_parts else None
        
        # Build URL (Coursera course URL pattern - using title as slug approximation)
        # Note: This is an approximation since we don't have the actual slug
        url = f"https://www.coursera.org/learn/{title.lower().replace(' ', '-').replace(',', '').replace(':', '')[:50]}"
        
        # Normalize level
        level = self.normalize_level(difficulty)
        
        # Use row index as source_course_id (the first column in CSV)
        source_course_id = str(row_index)
        
        return {
            'source_course_id': source_course_id,
            'title': title[:255] if title else None,  # Limit to 255 chars
            'summary': summary[:65535] if summary else None,  # TEXT field limit
            'language_': None,  # Not available in CSV
            'level_': level,
            'url': url[:255] if url else None,
            'last_updated': date.today()
        }
    
    def harvest(self):
        """
        Main harvest method - reads CSV and inserts courses into database
        """
        if not self.connect_db():
            return False
        
        if not self.get_or_create_source():
            self.disconnect_db()
            return False
        
        try:
            courses_processed = 0
            courses_inserted = 0
            courses_updated = 0
            errors = 0
            
            with open(self.csv_file, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row_index, row in enumerate(reader, start=1):
                    try:
                        course_data = self.parse_csv_row(row, row_index)
                        
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
                        print(f"Error processing row {row_index}: {e}")
                        errors += 1
                        continue
            
            print(f"\nHarvest completed!")
            print(f"Total courses processed: {courses_processed}")
            print(f"  - New courses inserted: {courses_inserted}")
            print(f"  - Existing courses updated: {courses_updated}")
            print(f"  - Errors: {errors}")
            
            return True
            
        except FileNotFoundError:
            print(f"Error: CSV file '{self.csv_file}' not found")
            return False
        except Exception as e:
            print(f"Error during harvest: {e}")
            return False
        finally:
            self.disconnect_db()


if __name__ == "__main__":
    harvester = CourseraHarvester()
    harvester.harvest()

