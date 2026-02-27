#!/usr/bin/env python3
"""Generate test tickets for DensityX event check-in."""

import argparse
import csv
import random
import string
from pathlib import Path


def generate_ticket_id():
    """Generate a ticket ID in DX-XXXXXX format."""
    random_part = ''.join(random.choices(string.digits, k=6))
    return f"DX-{random_part}"


def main():
    parser = argparse.ArgumentParser(description="Generate test tickets for DensityX")
    parser.add_argument("--count", type=int, default=100, help="Number of tickets to generate")
    parser.add_argument("--output", type=str, default="tickets.csv", help="Output CSV file")
    args = parser.parse_args()
    
    # Create output file in backend directory
    output_path = Path(__file__).parent.parent / args.output
    
    tickets = set()
    while len(tickets) < args.count:
        tickets.add(generate_ticket_id())
    
    # Write to CSV
    with open(output_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ticket_id', 'status'])
        for ticket in sorted(tickets):
            writer.writerow([ticket, 'valid'])
    
    print(f"✓ Generated {len(tickets)} tickets in {output_path}")


if __name__ == "__main__":
    main()
