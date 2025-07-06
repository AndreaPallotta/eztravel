import streamlit as st

_API = st.secrets.get("api", {})
_GENERAL = st.secrets.get("general", {})

ENV_CONFIGS = {
    "BASE_URL": _API.get("base_url", "http://localhost:3000"),
    "API_VERSION": _API.get("api_version", "v1"),
    "DEBUG": _GENERAL.get("debug", False),
}
