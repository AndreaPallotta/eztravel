import streamlit as st
from utils.api import api_get
from utils.env import ENV_CONFIGS
from utils.session import init_session
from utils.utils import general_setup

general_setup(title="Home")
init_session()
st.title("✈️ EZTravel")
st.subheader("Your effortless AI-powered travel companion")

st.markdown("""
Welcome to **EZTravel**, the app that helps you plan smarter, faster trips powered by AI.

Use the sidebar to:
- ✍️ Generate or view your travel itineraries
- 🔎 Test new ideas and prompts
- 🕒 Access your past searches
- 📊 View app status and metadata
""")

st.markdown("---")

st.markdown("#### System Status")
res_status = api_get(endpoint="/meta/health")

if res_status["error"]:
    st.error(res_status["error"])
else:
    components = res_status["data"].get("components", {})
    if components:
        cols = st.columns(len(components))
        for index, (component, is_healthy) in enumerate(components.items()):
            with cols[index]:
                if is_healthy:
                    st.success(f"✅ {component.upper()}: Ok")
                else:
                    st.warning(f"⚠️ {component.upper()}: Degraded")
                    if ENV_CONFIGS["DEBUG"]:
                        st.error(
                            f"{component.upper()} - {res_status['data'].get('errors', {}).get(component, '')}"
                        )

st.markdown("---")
st.markdown("### Ready to plan your next trip?")
st.button("Start Now", use_container_width=True)
