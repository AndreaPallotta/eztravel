import streamlit as st
from utils.api import api_delete, api_get
from utils.session import get_user
from utils.utils import general_setup

general_setup(title="My Itineraries", auth_required=True)
st.title("🕒 My Past Itineraries")

user = get_user()
user_id = user.get("id")

if not user_id:
    st.warning("User ID not found. Please log in again.")
    st.stop()

search_term = st.text_input("🔍 Search by destination or title")

res = api_get(endpoint="/itineraries", params={"userId": user_id})

if res["error"]:
    st.error(res["error"])
elif not res["data"]:
    st.info("No itineraries found.")
else:
    itineraries = res["data"]

    if search_term:
        search_term_lower = search_term.lower()
        itineraries = [
            i
            for i in itineraries
            if search_term_lower in i["title"].lower()
            or search_term_lower in i["location"].lower()
        ]

    for itinerary in itineraries:
        with st.expander(f"🧭 {itinerary['title']} - {itinerary['location']}"):
            st.markdown(f"**Days:** {itinerary['days']}")
            created_at = itinerary.get("created_at")
            if created_at:
                st.caption(f"Created on: {created_at}")
            st.json(itinerary.get("data", {}))

            if st.button("❌ Delete", key=f"del-{itinerary['id']}"):
                delete_res = api_delete(endpoint=f"/itineraries/{itinerary['id']}")
                if delete_res["error"]:
                    st.error(delete_res["error"])
                else:
                    st.success("Itinerary deleted successfully.")
                    st.rerun()
