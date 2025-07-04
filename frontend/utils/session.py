import streamlit as st

USER_KEY = "user"
AUTH_KEY = "authenticated"
TOKEN_KEY = "auth_token"


def init_session():
    if AUTH_KEY not in st.session_state:
        st.session_state[AUTH_KEY] = False
    if USER_KEY not in st.session_state:
        st.session_state[USER_KEY] = {}
    if TOKEN_KEY not in st.session_state:
        st.session_state[TOKEN_KEY] = ""


def is_authenticated():
    return st.session_state.get(AUTH_KEY, False)


def get_user():
    return st.session_state.get(USER_KEY, {})


def set_user(user, token):
    st.session_state[USER_KEY] = user
    st.session_state[AUTH_KEY] = True
    st.session_state[TOKEN_KEY] = token


def logout():
    st.session_state[USER_KEY] = {}
    st.session_state[AUTH_KEY] = False
    st.session_state[TOKEN_KEY] = ""
