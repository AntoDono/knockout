"""Shared test fixtures — in-memory DB, FastAPI test client."""

import pytest
from peewee import SqliteDatabase
from fastapi.testclient import TestClient

import database as db_module
from database import (
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
)

# Will be extended in Task 2 with Layer 2 models
ALL_MODELS = [
    Drug, Dose, Patient, PatientDiagnosis, PatientAllergy, KnownTrigger,
    Medication, ICDDevice, ICDZone, ICDEpisode, ICDShockHistory,
    ECGReading, StaticThreshold, ClinicalNote, SurgicalHistory,
]

_test_db = SqliteDatabase(":memory:", pragmas={"foreign_keys": 1})


@pytest.fixture(autouse=True)
def setup_test_db():
    """Bind all models to an in-memory DB, create tables, tear down after."""
    _test_db.bind(ALL_MODELS)
    _test_db.connect()
    _test_db.create_tables(ALL_MODELS)
    yield
    _test_db.drop_tables(ALL_MODELS)
    _test_db.close()


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
