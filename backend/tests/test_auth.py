"""
tests/test_auth.py — Integration tests for the auth routes.
Tests run against an in-memory SQLite database (see conftest.py).
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


# ── Register ──────────────────────────────────────────────────────────────────

async def test_register_success(client: AsyncClient):
    """Happy path: register returns 201 + a JWT."""
    response = await client.post("/auth/register", json={
        "email": "alice@example.com",
        "username": "alice",
        "password": "secret123",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@example.com"
    assert data["user"]["username"] == "alice"
    # Never leak the hashed password
    assert "hashed_password" not in data["user"]


async def test_register_duplicate_email(client: AsyncClient):
    """Registering with an existing email returns 409."""
    payload = {"email": "bob@example.com", "username": "bob", "password": "secret123"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json={**payload, "username": "bob2"})
    assert response.status_code == 409
    assert "email" in response.json()["detail"].lower()


async def test_register_duplicate_username(client: AsyncClient):
    """Registering with an existing username returns 409."""
    await client.post("/auth/register", json={
        "email": "carol@example.com", "username": "carol", "password": "secret123"
    })
    response = await client.post("/auth/register", json={
        "email": "carol2@example.com", "username": "carol", "password": "secret123"
    })
    assert response.status_code == 409
    assert "username" in response.json()["detail"].lower()


async def test_register_short_password(client: AsyncClient):
    """Password shorter than 8 chars returns 422."""
    response = await client.post("/auth/register", json={
        "email": "dave@example.com", "username": "dave", "password": "short"
    })
    assert response.status_code == 422


async def test_register_invalid_username(client: AsyncClient):
    """Username with special chars returns 422."""
    response = await client.post("/auth/register", json={
        "email": "eve@example.com", "username": "eve!@#", "password": "secret123"
    })
    assert response.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_success(client: AsyncClient):
    """Happy path: correct credentials return a JWT."""
    await client.post("/auth/register", json={
        "email": "frank@example.com", "username": "frank", "password": "secret123"
    })
    response = await client.post("/auth/login", json={
        "email": "frank@example.com", "password": "secret123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "frank@example.com"


async def test_login_wrong_password(client: AsyncClient):
    """Wrong password returns 401 (same message as wrong email to prevent enumeration)."""
    await client.post("/auth/register", json={
        "email": "grace@example.com", "username": "grace", "password": "secret123"
    })
    response = await client.post("/auth/login", json={
        "email": "grace@example.com", "password": "wrongpassword"
    })
    assert response.status_code == 401


async def test_login_unknown_email(client: AsyncClient):
    """Unknown email returns 401."""
    response = await client.post("/auth/login", json={
        "email": "nobody@example.com", "password": "secret123"
    })
    assert response.status_code == 401


# ── /auth/me ──────────────────────────────────────────────────────────────────

async def test_me_returns_profile(client: AsyncClient):
    """GET /auth/me with a valid token returns the user's profile."""
    reg = await client.post("/auth/register", json={
        "email": "henry@example.com", "username": "henry", "password": "secret123"
    })
    token = reg.json()["access_token"]

    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["username"] == "henry"


async def test_me_without_token(client: AsyncClient):
    """GET /auth/me without Authorization header returns 403."""
    response = await client.get("/auth/me")
    assert response.status_code in (401, 403)


async def test_me_with_invalid_token(client: AsyncClient):
    """GET /auth/me with a garbage token returns 401/403."""
    response = await client.get("/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
    assert response.status_code in (401, 403)
