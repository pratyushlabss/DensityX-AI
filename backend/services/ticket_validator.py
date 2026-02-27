"""
Ticket validation service.

Loads ticket IDs from CSV and provides validation methods.
Supports hot-reloading by reading CSV on every validation.
"""

import csv
from pathlib import Path
from typing import Set


class TicketValidator:
    """Validate ticket IDs against authorized list in CSV."""
    
    def __init__(self, csv_path: str = "backend/data/tickets.csv"):
        """
        Initialize ticket validator.
        
        Args:
            csv_path: Path to tickets.csv file
        """
        self.csv_path = Path(csv_path)
    
    def _load_tickets(self) -> Set[str]:
        """
        Load valid ticket IDs from CSV.
        
        Returns:
            Set of valid ticket IDs
        """
        if not self.csv_path.exists():
            return set()
        
        tickets = set()
        try:
            with open(self.csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row and 'ticket_id' in row:
                        ticket_id = row['ticket_id'].strip()
                        if ticket_id:
                            tickets.add(ticket_id)
        except (IOError, ValueError) as e:
            print(f"[ticket_validator] Warning: Error reading {self.csv_path}: {e}")
        
        return tickets
    
    def is_valid(self, ticket_id: str) -> bool:
        """
        Check if ticket ID is valid.
        
        Hot-reloads CSV on every call to support live CSV updates.
        
        Args:
            ticket_id: Ticket ID to validate
            
        Returns:
            True if valid, False otherwise
        """
        valid_tickets = self._load_tickets()
        return ticket_id.strip() in valid_tickets
    
    def count_valid_tickets(self) -> int:
        """Get total count of valid tickets in CSV."""
        return len(self._load_tickets())
    
    def get_sample_tickets(self, limit: int = 5) -> list:
        """Get sample valid ticket IDs."""
        valid_tickets = self._load_tickets()
        return sorted(list(valid_tickets))[:limit]


# Global instance
_validator = None


def get_validator() -> TicketValidator:
    """Get or create global ticket validator instance."""
    global _validator
    if _validator is None:
        _validator = TicketValidator()
    return _validator


def is_valid_ticket(ticket_id: str) -> bool:
    """Convenience function to validate a ticket."""
    return get_validator().is_valid(ticket_id)
