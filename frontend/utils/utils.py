import streamlit as st
from utils.session import get_user, is_authenticated, logout


def _set_sidebar():
    if is_authenticated():
        user = get_user()
        st.sidebar.markdown(f"👋 Welcome, **{user['first_name']}**")
        if st.sidebar.button("Logout", use_container_width=True, type="primary"):
            logout()
            st.rerun()
    else:
        if st.sidebar.button("Login", use_container_width=True, type="primary"):
            pass
        if st.sidebar.button("Sign Up", use_container_width=True):
            pass


def general_setup(title, full_width=False, auth_required=False):
    st.set_page_config(
        page_title=f"EZTravel - {title}",
        page_icon="✈️",
        layout="wide" if full_width else "centered",
        initial_sidebar_state="expanded",
    )
    _set_sidebar()
    if auth_required and not is_authenticated():
        st.warning("You must be logged in to access this page")
        st.stop()
