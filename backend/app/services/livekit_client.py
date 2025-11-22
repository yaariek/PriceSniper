from app.config import settings
import time

# Try importing livekit sdk, else fallback to manual JWT
try:
    from livekit import api
    HAS_LIVEKIT_SDK = True
except ImportError:
    HAS_LIVEKIT_SDK = False
    import jwt # fallback

class LiveKitClient:
    def create_token(self, room_name: str, identity: str) -> str:
        if HAS_LIVEKIT_SDK:
            token = api.AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET) \
                .with_identity(identity) \
                .with_name(identity) \
                .with_grants(api.VideoGrants(room_join=True, room=room_name))
            return token.to_jwt()
        else:
            # Manual JWT generation if SDK not present
            # This is a simplified version, might need adjustment for exact LiveKit claims
            payload = {
                "sub": identity,
                "iss": settings.LIVEKIT_API_KEY,
                "nbf": int(time.time()),
                "exp": int(time.time()) + 3600,
                "video": {
                    "room": room_name,
                    "roomJoin": True
                }
            }
            return jwt.encode(payload, settings.LIVEKIT_API_SECRET, algorithm="HS256")

    def get_url(self) -> str:
        return settings.LIVEKIT_URL
