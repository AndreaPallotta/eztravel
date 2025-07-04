import streamlit as st
from utils.api import api_get
from utils.utils import general_setup

general_setup(title="Metadata", full_width=True)
st.title("📊 Metadata & System Info")


def status_chip(is_ok):
    return "🟢 Healthy" if is_ok else "🔴 Degraded"


st.subheader("✅ Health Status")
health = api_get("meta/health")

if health["error"]:
    st.error(health["error"])
else:
    data = health["data"]
    cols = st.columns(len(data["components"]))
    for i, (name, ok) in enumerate(data["components"].items()):
        cols[i].metric(label=name.upper(), value=status_chip(ok))

    if "errors" in data:
        with st.expander("⚠️ Component Errors"):
            for k, v in data["errors"].items():
                st.error(f"**{k.upper()}**: {v}")

    st.caption(f"Last checked: {data['timestamp']}")

st.divider()
st.subheader("⏱️ Uptime")

uptime = api_get("meta/uptime")
if uptime["error"]:
    st.error(uptime["error"])
else:
    col1, col2 = st.columns(2)
    col1.metric("Server Uptime", uptime["data"]["server_uptime"])
    col2.metric("LLM Uptime", uptime["data"]["llm_uptime"])

    if uptime["data"].get("llm_errors"):
        st.error(f"LLM error: {uptime['data']['llm_errors']}")

st.divider()
st.subheader("🧠 Version Information")

version = api_get("meta/version")
if version["error"]:
    st.error(version["error"])
else:
    data = version.get("data", {})
    st.write(f"**App Version:** `{data.get('version', 'N/A')}`")
    st.write(f"**Last Commit** {data.get('commit', 'N/A')}")
    st.write(f"**Platform** {data.get('platform', '')}")
    st.write(f"**API** Node {data.get('nodeVersion', 'N/A')}")
    st.write(f"**Git**  {data.get('repo', '')} by {data.get('author', '')}")
    st.write(f"**Last Commit** {data.get('commit', 'N/A')}")
    llm = data.get("llm", {})
    st.write(f"**LLM Model:** `{llm.get('model', 'unknown')}`")
    st.write(f"**LLM Status:** {status_chip(llm.get('status') == 'loaded')}")
    if "details" in llm and llm["details"]:
        with st.expander("🔍 LLM Details"):
            st.json(llm["details"])

st.divider()
st.subheader("🧠 Cache Insights")

cache = api_get("meta/cache")
if cache["error"]:
    st.error(cache["error"])
else:
    entries = cache["data"].get("entries", {})
    st.metric("Cached Responses", len(entries))
    if entries:
        with st.expander("📦 Cached Items"):
            for key, item in entries.items():
                st.code(f"{key}: {item}", language="json")
    else:
        st.info("No cached items found.")
