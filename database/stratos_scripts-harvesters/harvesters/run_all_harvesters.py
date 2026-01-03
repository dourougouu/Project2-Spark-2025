"""
Main script to run all harvesters
"""

import sys
import os

# Add parent directory to path for running as script
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from harvesters.coursera_harvester import CourseraHarvester
    from harvesters.udacity_harvester import UdacityHarvester
except ImportError:
    from coursera_harvester import CourseraHarvester
    from udacity_harvester import UdacityHarvester


def main():
    """Run all harvesters"""
    print("=" * 60)
    print("Starting Data Harvesting Process")
    print("=" * 60)
    
    # Harvest Coursera courses
    print("\n[1/2] Harvesting Coursera courses...")
    print("-" * 60)
    coursera_harvester = CourseraHarvester()
    coursera_success = coursera_harvester.harvest()
    
    # Harvest Udacity courses
    print("\n[2/2] Harvesting Udacity courses...")
    print("-" * 60)
    udacity_harvester = UdacityHarvester()
    udacity_success = udacity_harvester.harvest()
    
    # Summary
    print("\n" + "=" * 60)
    print("Harvesting Summary")
    print("=" * 60)
    print(f"Coursera: {'✓ Success' if coursera_success else '✗ Failed'}")
    print(f"Udacity:  {'✓ Success' if udacity_success else '✗ Failed'}")
    print("=" * 60)


if __name__ == "__main__":
    main()

