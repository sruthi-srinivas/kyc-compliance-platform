"""Document REST API endpoints."""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models import Document, Verification, Customer
from backend.app.schemas import DocumentRead, DocumentCreate, VerificationRead, VerificationUpdate
from backend.app.services import ComplianceService

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[DocumentRead])
def get_documents(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    lifecycle_state: Optional[str] = Query(None, description="Filter by state (VALID, EXPIRED, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if customer_id:
        query = query.filter(Document.customer_id == customer_id)
    if document_type:
        query = query.filter(Document.document_type == document_type)
    if lifecycle_state:
        query = query.filter(Document.lifecycle_state == lifecycle_state)
    return query.order_by(Document.id).offset(skip).limit(limit).all()

@router.get("/{document_id}")
def get_document_details(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document {document_id} not found")

    verification = db.query(Verification).filter(Verification.document_id == document_id).first()
    return {
        "document": doc,
        "verification": verification
    }

@router.post("/{document_id}/verify", response_model=VerificationRead)
def verify_document(
    document_id: str,
    payload: VerificationUpdate,
    db: Session = Depends(get_db)
):
    try:
        ver = ComplianceService.verify_document(
            db=db,
            document_id=document_id,
            status=payload.status,
            actor=payload.actor,
            notes=payload.analyst_notes
        )
        return ver
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
