"""Shared test fixtures — in-memory DB, FastAPI test client."""

import os
import tempfile

import pytest
from peewee import SqliteDatabase
from fastapi.testclient import TestClient

import database as db_module
from database import (
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
)

ALL_MODELS = [
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
    HeartRateReading, HRVReading, SleepRecord,
    TemperatureReading, WeatherReading, Episode,
]


@pytest.fixture(autouse=True)
def setup_test_db(tmp_path):
    """Bind all models to a temp-file DB, create tables, tear down after.

    Uses a temp file instead of :memory: so that the FastAPI TestClient
    (which may run requests in a separate thread) shares the same database.
    """
    db_path = str(tmp_path / "test.db")
    _test_db = SqliteDatabase(db_path, pragmas={"foreign_keys": 1})
    _test_db.bind(ALL_MODELS)
    _test_db.connect()
    _test_db.create_tables(ALL_MODELS)

    # Also patch the module-level db so init_db() is harmless
    _original_db = db_module.db
    db_module.db = _test_db

    yield _test_db

    _test_db.drop_tables(ALL_MODELS)
    _test_db.close()
    db_module.db = _original_db


@pytest.fixture
def seed_patient():
    """Create a minimal test patient with static thresholds."""
    patient = Patient.create(
        first_name="Test",
        last_name="Patient",
        date_of_birth="2006-01-19",
        sex="female",
        primary_diagnosis="TKOS",
    )
    StaticThreshold.create(
        patient=patient,
        effective_date="2025-11-20",
        resting_hr_bpm=70,
        icd_gap_lower_bpm=70,
        icd_gap_upper_bpm=190,
        is_current=True,
    )
    return patient


@pytest.fixture
def client():
    """FastAPI TestClient with in-memory DB."""
    from server import app
    return TestClient(app)
