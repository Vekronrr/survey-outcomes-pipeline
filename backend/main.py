import io
import os
from typing import Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from cleaner import clean_survey_data
from wordcloud_gen import generate_word_frequency

app = FastAPI(title="Survey Outcomes Pipeline", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAMPLE_PATH = os.path.join(BASE_DIR, "sample_data", "sample_survey.csv")
EXPORT_DIR = os.path.join(BASE_DIR, "exports")

_raw_df: Optional[pd.DataFrame] = None
_cleaned_df: Optional[pd.DataFrame] = None


@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):
    global _raw_df, _cleaned_df
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    try:
        _raw_df = pd.read_csv(io.BytesIO(content))
        _cleaned_df = None
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")
    return {"filename": file.filename, "rows": len(_raw_df), "columns": list(_raw_df.columns)}


@app.get("/api/sample")
async def load_sample():
    global _raw_df, _cleaned_df
    if not os.path.exists(SAMPLE_PATH):
        raise HTTPException(status_code=404, detail="Sample data not found")
    _raw_df = pd.read_csv(SAMPLE_PATH)
    _cleaned_df = None
    return {"filename": "sample_survey.csv", "rows": len(_raw_df), "columns": list(_raw_df.columns)}


@app.post("/api/clean")
async def clean_data():
    global _cleaned_df
    if _raw_df is None:
        raise HTTPException(status_code=400, detail="No data uploaded yet")
    _cleaned_df, report = clean_survey_data(_raw_df)
    return {"rows_after": len(_cleaned_df), "report": report}


@app.get("/api/stats")
async def get_stats():
    df = _cleaned_df if _cleaned_df is not None else _raw_df
    if df is None:
        raise HTTPException(status_code=400, detail="No data available")

    industry_counts = (
        df.groupby("industry").size().reset_index(name="count")
        .sort_values("count", ascending=False)
    )

    salary_df = df[df["salary"].notna() & (df["salary"] > 0)]["salary"]
    salary_hist = []
    if len(salary_df) > 1:
        buckets = pd.cut(salary_df, bins=10)
        counts = buckets.value_counts().sort_index()
        for interval, count in counts.items():
            salary_hist.append({
                "range": f"${int(interval.left / 1000)}k–${int(interval.right / 1000)}k",
                "count": int(count),
            })

    dept_breakdown = (
        df.groupby("department")
        .agg(
            total=("student_id", "count"),
            employed=("employment_status", lambda x: (x == "Employed Full-time").sum()),
            avg_salary=("salary", "mean"),
        )
        .reset_index()
    )
    dept_breakdown["avg_salary"] = dept_breakdown["avg_salary"].fillna(0).round(0).astype(int)
    dept_breakdown["employed_pct"] = (
        dept_breakdown["employed"] / dept_breakdown["total"] * 100
    ).round(1)

    status_counts = (
        df["employment_status"].value_counts().reset_index()
    )
    status_counts.columns = ["status", "count"]

    return {
        "industry_counts": industry_counts.to_dict(orient="records"),
        "salary_histogram": salary_hist,
        "department_breakdown": dept_breakdown.sort_values("total", ascending=False).to_dict(orient="records"),
        "status_counts": status_counts.to_dict(orient="records"),
        "total_respondents": len(df),
    }


@app.get("/api/wordcloud")
async def get_wordcloud():
    df = _cleaned_df if _cleaned_df is not None else _raw_df
    if df is None:
        raise HTTPException(status_code=400, detail="No data available")
    if "open_response" not in df.columns:
        raise HTTPException(status_code=400, detail="No open_response column found")
    responses = df["open_response"].dropna().astype(str).tolist()
    frequencies = generate_word_frequency(responses)
    return {"frequencies": frequencies}


@app.get("/api/export")
async def export_data():
    if _cleaned_df is None:
        raise HTTPException(status_code=400, detail="Run /api/clean before exporting")

    sf_df = _cleaned_df.rename(columns={
        "student_id": "Contact_External_ID__c",
        "department": "Academic_Department__c",
        "employment_status": "Employment_Status__c",
        "industry": "Industry__c",
        "salary": "Starting_Salary__c",
        "company": "Employer__c",
        "open_response": "Career_Feedback__c",
    })

    os.makedirs(EXPORT_DIR, exist_ok=True)
    sf_df.to_csv(os.path.join(EXPORT_DIR, "salesforce_ready.csv"), index=False)

    buf = io.BytesIO()
    sf_df.to_csv(buf, index=False)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=salesforce_ready.csv"},
    )
