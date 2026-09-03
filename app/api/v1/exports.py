import csv
import io
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.api.v1.reports import get_audit_report

router = APIRouter(tags=["Exports"])

@router.get("/audit-runs/{run_id}/export")
@router.get("/exports/{run_id}")
async def export_audit_report(run_id: str, format: str = "json"):
    report = await get_audit_report(run_id)
    if format == "json":
        return Response(json.dumps(report, default=str), media_type="application/json",
                        headers={"Content-Disposition": f'attachment; filename="{run_id}.json"'})
    if format != "csv":
        raise HTTPException(400, "Supported export formats: csv, json")
    output = io.StringIO()
    writer = csv.writer(output)
    fields = ["case_id", "title", "severity", "risk_score", "monetary_exposure"]
    writer.writerow(fields)
    for case in report["key_findings"]:
        values = [case.get(k, "") for k in fields]
        writer.writerow(["'" + v if isinstance(v, str) and v.startswith(("=", "+", "-", "@")) else v for v in values])
    return Response(output.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{run_id}.csv"'})
