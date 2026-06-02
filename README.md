# Survey Outcomes Pipeline

A full-stack career outcomes data pipeline that ingests raw Qualtrics-style survey exports, cleans and standardizes the data, visualizes key metrics, and exports Salesforce-ready CSVs.

---

## Features

- **CSV upload** — drag-and-drop or file browse, or load the included sample dataset
- **Automated cleaning** — deduplication, salary validation, department/industry name standardization, missing value handling
- **Interactive dashboard** — employment by industry, salary distribution histogram, employment status breakdown, department-level metrics table
- **Word cloud** — word frequency analysis of open-ended survey responses with interactive keyword grid
- **Salesforce export** — one-click download of cleaned data with Salesforce field name mapping

---

## Project Structure

```
survey-outcomes-pipeline/
├── backend/
│   ├── main.py            # FastAPI app — upload, clean, stats, export endpoints
│   ├── cleaner.py         # pandas cleaning logic (deduplication, normalization)
│   ├── wordcloud_gen.py   # word frequency generator for open responses
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # main app shell and workflow state machine
│   │   └── components/
│   │       ├── Dashboard.jsx            # Recharts visualizations + department table
│   │       └── WordCloud.jsx            # word frequency cloud and keyword grid
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── sample_data/
│   └── sample_survey.csv   # 73-row realistic Qualtrics-style export
└── exports/
    └── salesforce_ready.csv  # example cleaned Salesforce output
```

---

## Prerequisites

- Python 3.10+
- Node.js 18+

---

## Setup & Run

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the FastAPI backend automatically.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload a CSV file |
| `GET` | `/api/sample` | Load the bundled sample dataset |
| `POST` | `/api/clean` | Run cleaning pipeline on uploaded data |
| `GET` | `/api/stats` | Get employment stats, salary histogram, department breakdown |
| `GET` | `/api/wordcloud` | Get word frequency data from open responses |
| `GET` | `/api/export` | Download cleaned data as Salesforce-ready CSV |

---

## Data Cleaning Logic

The pipeline (`cleaner.py`) performs these operations in order:

1. **Drop empty rows** — fully-null rows are removed
2. **Normalize column names** — strips whitespace and lowercases headers
3. **Standardize departments** — e.g. `"comp sci"`, `"CS"`, `"compsci"` → `"Computer Science"`
4. **Standardize industries** — e.g. `"tech"`, `"software"`, `"IT"` → `"Technology"`
5. **Clean employment status** — maps variants to canonical values (`Employed Full-time`, `Graduate School`, etc.)
6. **Validate salaries** — nulls out values below $10,000 or above $500,000, strips `$` and `,`
7. **Remove duplicate student IDs** — keeps first occurrence
8. **Fill missing text** — empty open responses and companies set to empty string / "Not Provided"

---

## Salesforce Export Column Mapping

| Survey Column | Salesforce Field |
|---------------|-----------------|
| `student_id` | `Contact_External_ID__c` |
| `department` | `Academic_Department__c` |
| `employment_status` | `Employment_Status__c` |
| `industry` | `Industry__c` |
| `salary` | `Starting_Salary__c` |
| `company` | `Employer__c` |
| `open_response` | `Career_Feedback__c` |

---

## Sample Dataset

The included `sample_data/sample_survey.csv` (73 rows) contains:
- Mix of clean and intentionally messy department/industry names to demonstrate normalization
- One duplicate student ID
- Salary outlier (`$3,000,000`) that gets nulled by the cleaner
- Missing salary, company, and open response values
- Realistic open-ended responses across multiple career paths
