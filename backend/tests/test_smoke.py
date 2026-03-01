"""Smoke test — verify test infra works."""

from database import Patient


def test_db_setup(seed_patient):
    assert Patient.select().count() == 1
    assert seed_patient.first_name == "Test"
