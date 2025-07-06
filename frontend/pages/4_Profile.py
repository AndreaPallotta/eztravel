import streamlit as st
from utils.api import api_put
from utils.session import get_user, logout
from utils.utils import general_setup

general_setup(title="My Profile", auth_required=True)
st.title("👤 User Profile")

user = get_user()

if not user:
    st.warning("User data not available.")
    st.stop()

st.subheader("📋 Account Details")
st.write(f"**First Name:** {user.get('first_name', 'N/A')}")
st.write(f"**Last Name:** {user.get('last_name', 'N/A')}")
st.write(f"**Email:** {user.get('email', 'N/A')}")

created_at = user.get("created_at")
if created_at:
    st.write(f"**Joined:** {created_at}")

st.divider()

st.subheader("⚙️ Account Actions")

with st.expander("🔐 Reset Password"):
    current_pw = st.text_input("Current Password", type="password")
    new_pw = st.text_input("New Password", type="password")
    confirm_pw = st.text_input("Confirm New Password", type="password")
    if st.button("Submit Password Reset"):
        if new_pw != confirm_pw:
            st.error("Passwords do not match.")
        elif not new_pw or not current_pw:
            st.error("All fields are required.")
        else:
            response = api_put(
                "users/reset-password",
                body={
                    "userId": user["id"],
                    "currentPassword": current_pw,
                    "newPassword": new_pw,
                },
                loading_text="Resetting password...",
            )
            if response["error"]:
                st.error(response["error"])
            else:
                st.success("Password updated successfully!")

if st.button("Logout", type="primary"):
    logout()
    st.success("Logged out successfully.")
    st.rerun()
