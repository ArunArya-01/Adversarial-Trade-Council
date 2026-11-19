"""Explicit, auditable model-governance state transitions.

These operations manage research-model metadata only; they never place trades,
expose credentials, or bypass artifact validation.
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from database.models import ModelArtifactRecord, ModelGovernanceEvent


class GovernanceError(ValueError):
    pass


def _event(db: Session, version: str, event_type: str, actor: str, reason: str, details: dict | None = None) -> None:
    db.add(ModelGovernanceEvent(model_version=version, event_type=event_type, actor=actor, reason=reason, details=details or {}))


def register_candidate(db: Session, model_version: str, bundle_sha256: str, prepared_data_sha256: str, actor: str, reason: str) -> ModelArtifactRecord:
    if not all((model_version.strip(), bundle_sha256.strip(), prepared_data_sha256.strip(), actor.strip(), reason.strip())):
        raise GovernanceError("model version, hashes, actor, and reason are required")
    if db.get(ModelArtifactRecord, model_version) or db.query(ModelArtifactRecord).filter_by(bundle_sha256=bundle_sha256).first():
        raise GovernanceError("model version or bundle hash is already registered")
    record = ModelArtifactRecord(model_version=model_version, bundle_sha256=bundle_sha256, prepared_data_sha256=prepared_data_sha256, status="candidate")
    db.add(record); _event(db, model_version, "registered", actor, reason); db.commit(); return record


def approve_candidate(db: Session, model_version: str, actor: str, reason: str) -> ModelArtifactRecord:
    record = db.get(ModelArtifactRecord, model_version)
    if record is None or record.status != "candidate" or not actor.strip() or not reason.strip():
        raise GovernanceError("only a candidate with explicit actor and reason may be approved")
    record.status, record.approved_by, record.approval_reason, record.approved_at = "approved", actor, reason, datetime.utcnow()
    _event(db, model_version, "approved", actor, reason); db.commit(); return record


def activate_approved(db: Session, model_version: str, actor: str, reason: str) -> ModelArtifactRecord:
    record = db.get(ModelArtifactRecord, model_version)
    if record is None or record.status != "approved" or not actor.strip() or not reason.strip():
        raise GovernanceError("only an explicitly approved model may be activated")
    for active in db.query(ModelArtifactRecord).filter_by(status="active").all():
        active.status = "approved"; _event(db, active.model_version, "deactivated", actor, f"superseded by {model_version}")
    record.status = "active"; _event(db, model_version, "activated", actor, reason); db.commit(); return record


def governance_summary(db: Session) -> dict:
    active = db.query(ModelArtifactRecord).filter_by(status="active").one_or_none()
    return {"active_model_version": active.model_version if active else None, "records": [{"model_version": row.model_version, "status": row.status, "bundle_sha256": row.bundle_sha256, "prepared_data_sha256": row.prepared_data_sha256, "approved_by": row.approved_by} for row in db.query(ModelArtifactRecord).order_by(ModelArtifactRecord.created_at.desc()).all()], "notice": "Governance metadata does not load a model or enable trading."}
