"""
Streamlit UI for the Care Coordination API.

Calls FastAPI over HTTP (same contract as clients / API_CONTRACT.md).
Set API_BASE_URL in .env or the sidebar (default: http://127.0.0.1:8000).

Run:  streamlit run streamlit_app.py
Requires: uvicorn app.main:app running, and ANTHROPIC_API_KEY set in .env.
"""

from __future__ import annotations

import os
import json

import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

DEFAULT_API_BASE = os.getenv("API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")

SAMPLE_DISCHARGE = """Patient Rajesh Kumar, 68/M, admitted with chest pain and diagnosed with NSTEMI; stabilized and discharged today.
Discharge meds: Aspirin 75 mg OD, Clopidogrel 75 mg OD, Atorvastatin 40 mg HS, Metformin 500 mg BD.
Follow-up: Cardiology OPD in 1 week with repeat ECG; advised low-salt diabetic diet and no heavy exertion for 4 weeks.
Social note: patient lives alone, daughter out of city, home nurse visit recommended for medication adherence check."""

SESSION_CARE_PLAN = "care_plan_data"
SESSION_RISK = "risk_assessment_data"
SESSION_COMMS = "communication_plan_data"
SESSION_API_BASE = "api_base_url"
WIDGET_DISCHARGE = "widget_discharge_summary"


def _error_message(response: requests.Response) -> str:
    try:
        body = response.json()
        detail = body.get("detail")
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list):
            parts = []
            for item in detail:
                if isinstance(item, dict):
                    loc = ".".join(str(x) for x in item.get("loc", []))
                    msg = item.get("msg", str(item))
                    parts.append(f"{loc}: {msg}" if loc else msg)
                else:
                    parts.append(str(item))
            return "\n".join(parts) if parts else json.dumps(body, indent=2)
        return json.dumps(body, indent=2)
    except (ValueError, TypeError):
        return response.text or f"HTTP {response.status_code}"


def _api_post(base: str, path: str, payload: dict) -> requests.Response:
    url = f"{base.rstrip('/')}{path}"
    return requests.post(
        url,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=180,
    )


def _init_session() -> None:
    if SESSION_API_BASE not in st.session_state:
        st.session_state[SESSION_API_BASE] = DEFAULT_API_BASE
    if SESSION_CARE_PLAN not in st.session_state:
        st.session_state[SESSION_CARE_PLAN] = None
    if SESSION_RISK not in st.session_state:
        st.session_state[SESSION_RISK] = None
    if SESSION_COMMS not in st.session_state:
        st.session_state[SESSION_COMMS] = None
    if WIDGET_DISCHARGE not in st.session_state:
        st.session_state[WIDGET_DISCHARGE] = SAMPLE_DISCHARGE


def main() -> None:
    st.set_page_config(
        page_title="Care Coordination Agent",
        page_icon="🏥",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    _init_session()

    st.title("Post-discharge care coordination")
    st.caption("Agent 1: care planner · Agent 2: risk assessor (calls the FastAPI backend over HTTP)")

    with st.sidebar:
        st.subheader("Connection")
        api_base = st.text_input(
            "API base URL",
            value=st.session_state[SESSION_API_BASE],
            help="Must match your uvicorn host/port. Override with API_BASE_URL in .env.",
        )
        st.session_state[SESSION_API_BASE] = api_base.rstrip("/")
        base_check = st.session_state[SESSION_API_BASE]
        if st.button("Check API health", use_container_width=True):
            try:
                h = requests.get(f"{base_check}/health", timeout=10)
                if h.status_code == 200:
                    st.success(h.json())
                else:
                    st.error(f"HTTP {h.status_code}")
            except requests.RequestException as e:
                st.error(f"Not reachable: {e}")
        st.divider()
        st.markdown(
            "1. Set `ANTHROPIC_API_KEY` in `.env`\n"
            "2. Start API: `python -m uvicorn app.main:app --reload`\n"
            "3. Use this app"
        )
        if st.button("Clear stored results"):
            st.session_state[SESSION_CARE_PLAN] = None
            st.session_state[SESSION_RISK] = None
            st.session_state[SESSION_COMMS] = None
            st.rerun()

    col_left, col_right = st.columns((1, 1), gap="large")

    with col_left:
        st.subheader("Discharge summary")
        st.text_area(
            "Paste discharge summary",
            height=280,
            label_visibility="collapsed",
            placeholder="Discharge summary text for Agent 1...",
            key=WIDGET_DISCHARGE,
        )
        summary = st.session_state.get(WIDGET_DISCHARGE) or ""
        b1, b2 = st.columns(2)
        with b1:
            run1 = st.button("Run Agent 1 (care planner)", type="primary", use_container_width=True)
        with b2:
            if st.button("Load sample text", use_container_width=True):
                st.session_state[WIDGET_DISCHARGE] = SAMPLE_DISCHARGE
                st.rerun()

    base = st.session_state[SESSION_API_BASE]

    if run1:
        st.session_state[SESSION_RISK] = None
        st.session_state[SESSION_COMMS] = None
        if not summary.strip():
            st.error("Discharge summary cannot be empty (API returns 400).")
        else:
            with st.spinner("Calling carePlannerAgent..."):
                try:
                    resp = _api_post(
                        base,
                        "/api/carePlannerAgent",
                        {"discharge_summary": summary.strip()},
                    )
                except requests.RequestException as e:
                    st.error(f"Request failed: {e}")
                    resp = None
            if resp is not None:
                if resp.status_code == 200:
                    out = resp.json()
                    st.session_state[SESSION_CARE_PLAN] = out.get("data")
                    st.success("Agent 1 completed.")
                else:
                    st.session_state[SESSION_CARE_PLAN] = None
                    st.error(f"Agent 1 failed ({resp.status_code})")
                    st.code(_error_message(resp))

    with col_right:
        st.subheader("Agent 1 result (care plan)")
        cp = st.session_state[SESSION_CARE_PLAN]
        if cp is None:
            st.info("Run Agent 1 to populate the structured care plan.")
        else:
            st.json(cp)
            with st.expander("Raw JSON (copy for debugging)"):
                st.code(json.dumps(cp, indent=2), language="json")

        st.subheader("Agent 2 (risk assessor)")
        run2 = st.button(
            "Run Agent 2 (risk assessor)",
            type="primary",
            disabled=cp is None,
            use_container_width=True,
            help='Sends { "care_plan": <Agent 1 data> } to /api/riskAssessorAgent',
        )
        if run2 and cp is not None:
            st.session_state[SESSION_COMMS] = None
            with st.spinner("Calling riskAssessorAgent..."):
                try:
                    resp2 = _api_post(
                        base,
                        "/api/riskAssessorAgent",
                        {"care_plan": cp},
                    )
                except requests.RequestException as e:
                    st.error(f"Request failed: {e}")
                    resp2 = None
            if resp2 is not None:
                if resp2.status_code == 200:
                    out2 = resp2.json()
                    st.session_state[SESSION_RISK] = out2.get("data")
                    st.success("Agent 2 completed.")
                else:
                    st.session_state[SESSION_RISK] = None
                    st.error(f"Agent 2 failed ({resp2.status_code})")
                    st.code(_error_message(resp2))

        risk = st.session_state[SESSION_RISK]
        if risk is not None:
            st.markdown("**Risk output**")
            st.json(risk)
            with st.expander("Raw risk JSON"):
                st.code(json.dumps(risk, indent=2), language="json")

        st.subheader("Agent 3 (communication drafter)")
        run3 = st.button(
            "Run Agent 3 (communication drafter)",
            type="primary",
            disabled=risk is None,
            use_container_width=True,
            help='Sends { "care_plan": <Agent 1>, "risk_assessment": <Agent 2> } to /api/communicationDrafterAgent',
        )
        if run3 and cp is not None and risk is not None:
            with st.spinner("Calling communicationDrafterAgent..."):
                try:
                    resp3 = _api_post(
                        base,
                        "/api/communicationDrafterAgent",
                        {"care_plan": cp, "risk_assessment": risk},
                    )
                except requests.RequestException as e:
                    st.error(f"Request failed: {e}")
                    resp3 = None
            if resp3 is not None:
                if resp3.status_code == 200:
                    out3 = resp3.json()
                    st.session_state[SESSION_COMMS] = out3.get("data")
                    st.success("Agent 3 completed.")
                else:
                    st.session_state[SESSION_COMMS] = None
                    st.error(f"Agent 3 failed ({resp3.status_code})")
                    st.code(_error_message(resp3))

        comms = st.session_state[SESSION_COMMS]
        if comms is not None:
            st.markdown("**Drafted patient messages**")
            for msg in comms.get("messages", []):
                with st.expander(f"Day {msg.get('day')} — {msg.get('channel')} · {msg.get('subject', '')}"):
                    st.write(msg.get("body", ""))
                    if msg.get("call_to_action"):
                        st.markdown(f"**Do this:** {msg['call_to_action']}")
                    warnings = msg.get("warning_signs") or []
                    if warnings:
                        st.markdown("**Warning signs:**")
                        for w in warnings:
                            st.markdown(f"- {w}")
            with st.expander("Raw communication JSON"):
                st.code(json.dumps(comms, indent=2), language="json")

    st.divider()
    st.caption(
        f"Target API: `{base}` — OpenAPI docs: {base}/docs"
    )


if __name__ == "__main__":
    main()
