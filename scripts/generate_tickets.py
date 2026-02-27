#!/usr/bin/env python3
"""
Generate random ticket IDs and save to CSV.
This is a one-time setup script.

Usage:
    python scripts/generate_tickets.py --count 200 --output data/tickets.csv
"""

import argparse
import csv
import random
import string
from pathlib import Path


def generate_ticket_id(prefix="DX", length=6):
    """Generate a random ticket ID like DX-A9F3K2"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=length))
    return f"{prefix}-{random_part}"


def generate_tickets(count: int, output_path: str):
    """
    Generate ticket IDs and save to CSV file.
    
    Args:
        count: Number of tickets to generate
        output_path: Path to save CSV file
    """
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Generate unique ticket IDs
    tickets = set()
    while len(tickets) < count:
        tickets.add(generate_ticket_id())
    
    # Write to CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['ticket_id'])  # Header
        for ticket in sorted(tickets):
            writer.writerow([ticket])
    
    print(f"✓ Generated {count} tickets")
    print(f"✓ Saved to {output_file}")
    print(f"\nExample tickets:")
    for ticket in sorted(tickets)[:5]:
        print(f"  - {ticket}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate random ticket IDs for crowd verification"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=200,
        help="Number of tickets to generate (default: 200)"
    )
    parser.add_argument(
        "--output",
        default="backend/data/tickets.csv",
        help="Output CSV file path (default: backend/data/tickets.csv)"
    )
    
    args = parser.parse_args()
    generate_tickets(args.count, args.output)
