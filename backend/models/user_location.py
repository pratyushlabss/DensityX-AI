"""
User location model for real ticket-verified users.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserLocation(BaseModel):
    """Represents a verified user with GPS location."""
    
    ticket_id: str = Field(..., description="Verified ticket ID")
    name: Optional[str] = Field(None, description="User name")
    phone: Optional[str] = Field(None, description="User phone number")
    latitude: float = Field(..., description="GPS latitude")
    longitude: float = Field(..., description="GPS longitude")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last location update timestamp")
    gps_enabled: bool = Field(default=True, description="Whether GPS tracking is enabled")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "ticket_id": "DX-A9F3K2",
                "name": "John Doe",
                "phone": "+91-9876543210",
                "latitude": 13.0850,
                "longitude": 80.2101,
                "gps_enabled": True
            }
        }


class UserRegistration(BaseModel):
    """Request model for user registration."""
    
    ticket_id: str = Field(..., description="Ticket ID for verification")
    name: Optional[str] = Field(None, description="User name")
    phone: Optional[str] = Field(None, description="User phone")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "ticket_id": "DX-A9F3K2",
                "name": "John Doe",
                "phone": "+91-9876543210"
            }
        }


class UserLocationUpdate(BaseModel):
    """Request model for location updates."""
    
    ticket_id: str = Field(..., description="User's verified ticket ID")
    latitude: float = Field(..., description="GPS latitude")
    longitude: float = Field(..., description="GPS longitude")
    gps_enabled: bool = Field(default=True, description="GPS tracking status")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "ticket_id": "DX-A9F3K2",
                "latitude": 13.0850,
                "longitude": 80.2101,
                "gps_enabled": True
            }
        }


class UserSessionResponse(BaseModel):
    """Response model for user session."""
    
    status: str = Field(..., description="Registration status")
    ticket_id: str = Field(..., description="User's ticket ID")
    message: str = Field(..., description="Status message")
    
    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "status": "registered",
                "ticket_id": "DX-A9F3K2",
                "message": "User registered successfully"
            }
        }
