from typing import Optional, Tuple

import pandas as pd

DEPARTMENT_MAP = {
    "comp sci": "Computer Science",
    "cs": "Computer Science",
    "computer science": "Computer Science",
    "compsci": "Computer Science",
    "data sci": "Data Science",
    "data science": "Data Science",
    "biz": "Business",
    "business admin": "Business",
    "business administration": "Business",
    "mba": "Business",
    "mech eng": "Mechanical Engineering",
    "mechanical eng": "Mechanical Engineering",
    "mechanical engineering": "Mechanical Engineering",
    "elec eng": "Electrical Engineering",
    "electrical eng": "Electrical Engineering",
    "electrical engineering": "Electrical Engineering",
    "bio": "Biology",
    "biology": "Biology",
    "bioscience": "Biology",
    "econ": "Economics",
    "economics": "Economics",
    "psych": "Psychology",
    "psychology": "Psychology",
    "math": "Mathematics",
    "mathematics": "Mathematics",
    "stats": "Statistics",
    "statistics": "Statistics",
    "nursing": "Nursing",
    "comm": "Communications",
    "communications": "Communications",
}

INDUSTRY_MAP = {
    "tech": "Technology",
    "technology": "Technology",
    "software": "Technology",
    "it": "Technology",
    "information technology": "Technology",
    "finance": "Finance",
    "financial services": "Finance",
    "banking": "Finance",
    "healthcare": "Healthcare",
    "health care": "Healthcare",
    "medical": "Healthcare",
    "hospital": "Healthcare",
    "education": "Education",
    "academia": "Education",
    "government": "Government",
    "public sector": "Government",
    "nonprofit": "Nonprofit",
    "non-profit": "Nonprofit",
    "consulting": "Consulting",
    "manufacturing": "Manufacturing",
    "retail": "Retail",
    "media": "Media & Entertainment",
    "entertainment": "Media & Entertainment",
    "marketing": "Marketing",
    "real estate": "Real Estate",
    "biotech": "Biotech",
    "biotechnology": "Biotech",
    "pharma": "Biotech",
    "pharmaceutical": "Biotech",
}

VALID_STATUSES = {
    "employed full-time",
    "employed part-time",
    "seeking employment",
    "graduate school",
    "not seeking",
}

STATUS_NORMALIZE = {
    "full time": "Employed Full-time",
    "full-time": "Employed Full-time",
    "ft employed": "Employed Full-time",
    "part time": "Employed Part-time",
    "part-time": "Employed Part-time",
    "job seeking": "Seeking Employment",
    "seeking": "Seeking Employment",
    "grad school": "Graduate School",
    "graduate": "Graduate School",
    "school": "Graduate School",
}


def _normalize(value, mapping: dict) -> str:
    if pd.isna(value):
        return "Unknown"
    key = str(value).strip().lower()
    if key in mapping:
        return mapping[key]
    # Return title-cased original if no mapping found
    return str(value).strip().title()


def _clean_salary(value) -> Optional[float]:
    if pd.isna(value):
        return None
    raw = str(value).replace("$", "").replace(",", "").strip()
    try:
        val = float(raw)
        if val < 10_000 or val > 500_000:
            return None
        return val
    except ValueError:
        return None


def _clean_status(value) -> str:
    if pd.isna(value):
        return "Unknown"
    v = str(value).strip()
    lower = v.lower()
    if lower in VALID_STATUSES:
        return v.title().replace("Full-time", "Full-time").replace("Part-time", "Part-time")
    if lower in STATUS_NORMALIZE:
        return STATUS_NORMALIZE[lower]
    return "Unknown"


def clean_survey_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict]:
    report: dict = {}
    df = df.copy()
    original_rows = len(df)

    # Drop fully-empty rows
    df.dropna(how="all", inplace=True)
    report["empty_rows_dropped"] = original_rows - len(df)

    # Normalize column names
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    # Standardize department
    if "department" in df.columns:
        df["department"] = df["department"].apply(lambda v: _normalize(v, DEPARTMENT_MAP))

    # Standardize industry
    if "industry" in df.columns:
        df["industry"] = df["industry"].apply(lambda v: _normalize(v, INDUSTRY_MAP))

    # Clean employment status
    if "employment_status" in df.columns:
        original_statuses = df["employment_status"].copy()
        df["employment_status"] = df["employment_status"].apply(_clean_status)
        report["status_normalized"] = int((df["employment_status"] != original_statuses.fillna("Unknown")).sum())

    # Clean salary — remove invalid values
    if "salary" in df.columns:
        before_nulls = df["salary"].isna().sum()
        df["salary"] = df["salary"].apply(_clean_salary)
        after_nulls = df["salary"].isna().sum()
        report["invalid_salaries_nulled"] = int(after_nulls - before_nulls)

    # Remove duplicate student_ids (keep first occurrence)
    if "student_id" in df.columns:
        dupes = df.duplicated(subset=["student_id"]).sum()
        df.drop_duplicates(subset=["student_id"], keep="first", inplace=True)
        report["duplicate_ids_removed"] = int(dupes)

    # Fill missing open responses with empty string
    if "open_response" in df.columns:
        missing = int(df["open_response"].isna().sum())
        df["open_response"] = df["open_response"].fillna("")
        report["open_responses_filled"] = missing

    # Fill missing company
    if "company" in df.columns:
        df["company"] = df["company"].fillna("Not Provided")

    report["final_rows"] = len(df)
    return df, report
