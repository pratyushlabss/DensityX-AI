"""
User registration and location tracking endpoints.

Handles:
- User registration with ticket verification
- Real GPS location updates
- Active user tracking
"""

from fastapi import APIRouter, HTTPException, status

from models.user_location import (
    UserLocation,
    UserLocationUpdate,
    UserRegistration,
    UserSessionResponse,
)
from services.ticket_validator import is_valid_ticket
from storage import memory_store

router = APIRouter(prefix="/user", tags=["user"])


@router.post(
    "/register",
    response_model=UserSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(registration: UserRegistration):
    """
    Register a user with verified ticket.
    """

    # Validate ticket
    if not is_valid_ticket(registration.ticket_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ticket ID: {registration.ticket_id}",
        )

    # Create user with default location
    user = UserLocation(
        ticket_id=registration.ticket_id,
        name=registration.name,
        phone=registration.phone,
        latitude=0.0,
        longitude=0.0,
        gps_enabled=False,
    )

    # Store user
    memory_store.register_user(user)

    return UserSessionResponse(
        status="registered",
        ticket_id=registration.ticket_id,
        message=f"User {registration.name or registration.ticket_id} registered. Please enable GPS.",
    )


@router.post("/location", status_code=status.HTTP_200_OK)
def update_location(update: UserLocationUpdate):
    """
    Update user GPS location.
    """

    user = memory_store.get_user(update.ticket_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {update.ticket_id} not registered. Call /user/register first.",
        )

    memory_store.update_user_location(
        ticket_id=update.ticket_id,
        latitude=update.latitude,
        longitude=update.longitude,
        gps_enabled=update.gps_enabled,
    )

    return {
        "status": "updated",
        "ticket_id": update.ticket_id,
        "message": f"Location updated: {update.latitude:.4f}, {update.longitude:.4f}",
        "gps_enabled": update.gps_enabled,
    }


@router.get("/me")
def get_my_profile(ticket_id: str):
    """
    Get current user profile.
    """

    user = memory_store.get_user(ticket_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {ticket_id} not found",
        )

    return user


@router.get("/active-users")
def get_active_users_list():
    """
    Get list of all active registered users.
    """

    users = memory_store.get_active_users()
    return {
        "count": len(users),
        "users": users,
    }


@router.get("/active-count")
def get_active_count():
    """
    Get count of active users and GPS-enabled users.
    """

    return {
        "active_users": memory_store.get_active_users_count(),
        "gps_enabled": len(memory_store.get_gps_enabled_users()),
    }


@router.post("/logout")
def logout_user(ticket_id: str):
    """
    Logout user (remove from active_users).
    """

    user = memory_store.get_user(ticket_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {ticket_id} not found",
        )

    memory_store._active_users.pop(ticket_id, None)

    return {
        "status": "logged_out",
        "ticket_id": ticket_id,
        "message": "User session closed",
    }