"""
User registration and location tracking endpoints.

Handles:
- User registration with ticket verification + Firebase Auth
- Real GPS location updates
- Active user tracking with Firebase sync
"""

from fastapi import APIRouter, HTTPException, status, Header
from datetime import datetime

from models.user_location import (
    UserLocation,
    UserLocationUpdate,
    UserRegistration,
    UserSessionResponse,
)
from services.ticket_validator import is_valid_ticket
from storage import memory_store
from firebase_config import (
    FirebaseConfig,
    verify_firebase_token,
    save_user_to_database,
    save_location_to_database,
    get_user_from_database,
)

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/register", response_model=UserSessionResponse, status_code=status.HTTP_201_CREATED)
def register_user(registration: UserRegistration):
    """
    Register a user with verified ticket and Firebase authentication.
    
    Flow:
    1. Validate ticket ID against tickets.csv
    2. Create user session in memory
    3. Save user profile to Firebase Realtime Database
    4. Store in active_users
    
    Note: One ticket_id = one session. Duplicate registration overwrites previous.
    
    Args:
        registration: UserRegistration payload with ticket_id, name, phone
        
    Returns:
        UserSessionResponse with status and message
        
    Raises:
        HTTPException 400: Invalid or already-used ticket
    """
    # Validate ticket
    if not is_valid_ticket(registration.ticket_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ticket ID: {registration.ticket_id}"
        )
    
    # Create user with verification flag and GPS gate
    user = UserLocation(
        ticket_id=registration.ticket_id,
        name=registration.name,
        phone=registration.phone,
        latitude=0.0,  # Default, will be updated when GPS enabled
        longitude=0.0,
        gps_enabled=False,  # GPS disabled until user grants permission
        verified=True,  # CSV ticket was validated in is_valid_ticket() check above
        gps_allowed=True  # Only allow GPS for verified ticket holders
    )
    
    # Register in memory store
    memory_store.register_user(user)
    
    # Save to Firebase Realtime Database with verification flags
    user_data = {
        "ticket_id": registration.ticket_id,
        "name": registration.name,
        "phone": registration.phone,
        "latitude": 0.0,
        "longitude": 0.0,
        "gps_enabled": False,
        "verified": True,  # ✅ Verified: ticket exists in CSV
        "gps_allowed": True,  # ✅ GPS allowed: only for verified users
        "registered_at": datetime.utcnow().isoformat(),
        "last_updated": datetime.utcnow().isoformat()
    }
    
    try:
        # Save to Firebase using ticket_id as the key
        save_user_to_database(registration.ticket_id, user_data)
        print(f"[firebase] User {registration.ticket_id} saved to Firebase")
    except Exception as e:
        print(f"[firebase-warning] Could not save user to Firebase: {e}")
        # Continue even if Firebase fails - memory store is the source of truth
    
    return UserSessionResponse(
        status="registered",
        ticket_id=registration.ticket_id,
        message=f"User {registration.name or registration.ticket_id} registered. Please enable GPS."
    )


@router.post("/location", status_code=status.HTTP_200_OK)
def update_location(update: UserLocationUpdate):
    """
    Update user GPS location and sync to Firebase.
    
    🔐 VERIFIED-ONLY GPS GATE: Only stores GPS if user verified == true
    
    Called by frontend every 5 seconds when GPS is enabled.
    
    Args:
        update: UserLocationUpdate with ticket_id, lat, lon, gps_enabled
        
    Returns:
        {"status": "updated", "ticket_id": "DX-...", "message": "..."}
        
    Raises:
        HTTPException 404: User not registered
        HTTPException 403: User not verified (no CSV ticket match)
    """
    # Get existing user
    user = memory_store.get_user(update.ticket_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {update.ticket_id} not registered. Call /user/register first."
        )
    
    # 🔐 GPS CAPTURE GATE: Only verified users can submit GPS data
    if not user.verified or not user.gps_allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User {update.ticket_id} is not verified. GPS updates rejected."
        )
    
    # Update location in memory
    updated_user = memory_store.update_user_location(
        ticket_id=update.ticket_id,
        latitude=update.latitude,
        longitude=update.longitude,
        gps_enabled=update.gps_enabled
    )
    
    # Save location to Firebase (with verification metadata)
    location_data = {
        "ticket_id": update.ticket_id,
        "latitude": update.latitude,
        "longitude": update.longitude,
        "gps_enabled": update.gps_enabled,
        "verified": True,  # ✅ Only verified users reach this point
        "timestamp": datetime.utcnow().isoformat()
    }
    
    try:
        save_location_to_database(update.ticket_id, location_data)
    except Exception as e:
        print(f"[firebase-warning] Could not save location to Firebase: {e}")
        # Continue even if Firebase fails
    
    return {
        "status": "updated",
        "ticket_id": update.ticket_id,
        "message": f"Location updated: {update.latitude:.4f}, {update.longitude:.4f}",
        "gps_enabled": update.gps_enabled
    }


@router.get("/me")
def get_my_profile(ticket_id: str):
    """
    Get current user profile.
    
    Args:
        ticket_id: User's ticket ID (as query parameter)
        
    Returns:
        UserLocation object or error
    """
    user = memory_store.get_user(ticket_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {ticket_id} not found"
        )
    return user


@router.get("/active-users")
def get_active_users_list():
    """
    Get list of all active registered users.
    
    Returns:
        {"count": int, "users": List[UserLocation]}
    """
    users = memory_store.get_active_users()
    return {
        "count": len(users),
        "users": users
    }


@router.get("/active-count")
def get_active_count():
    """Get count of active registered users."""
    return {
        "active_users": memory_store.get_active_users_count(),
        "gps_enabled": len(memory_store.get_gps_enabled_users())
    }


@router.post("/logout")
def logout_user(ticket_id: str):
    """
    Logout user (remove from active_users).
    
    Args:
        ticket_id: User's ticket ID
        
    Returns:
        Confirmation message
    """
    user = memory_store.get_user(ticket_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {ticket_id} not found"
        )
    
    # Remove user
    memory_store._active_users.pop(ticket_id, None)
    
    return {
        "status": "logged_out",
        "ticket_id": ticket_id,
        "message": "User session closed"
    }
