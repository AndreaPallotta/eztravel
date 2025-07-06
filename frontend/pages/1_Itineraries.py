import streamlit as st
from utils.api import api_post
from utils.session import get_user
from utils.utils import general_setup, new_session_var

general_setup("Itineraries", full_width=True)

st.title("✈️ Plan a New Itinerary")
tabs = st.tabs(["Form-based Builder", "Free-text Query"])

user = get_user()
user_id = user.get("id") if user else None

new_session_var("has_dest", False)
new_session_var("destination", "")
new_session_var("days", 5)
new_session_var("weather", "")
new_session_var("activities", [])
new_session_var("cost_range", (500, 1500))
new_session_var("curr_location", "")

with tabs[0]:
    st.subheader("📝 Build Your Itinerary")

    st.toggle("I already have a destination", key="has_dest")

    if st.session_state.has_dest:
        st.text_input("Destination", key="destination", placeholder="e.g. Tokyo")
    else:
        st.text_input(
            "Ideal Country/State Destination",
            key="destination",
            placeholder="e.g. United States, Arizona",
        )

    st.text_input(
        "Your current location", key="curr_location", placeholder="e.g. New York City"
    )

    st.slider("Number of Days", 1, 30, key="days")
    st.slider("Cost Range", min_value=100, max_value=10000, key="cost_range", step=50)
    st.selectbox(
        "Preferred Weather",
        ["No preference", "Sunny", "Mild", "Cold", "Rainy"],
        key="weather",
    )
    st.multiselect(
        "Activities You're Interested In",
        [
            "Sightseeing",
            "Nature",
            "Food",
            "Museums",
            "Adventure",
            "Relaxation",
            "Nightlife",
            "Shopping",
        ],
        key="activities",
    )

    if st.button("Generate"):
        payload = {
            "userId": user_id,
            "hasDest": st.session_state.has_dest,
            "destination": st.session_state.destination,
            "days": st.session_state.days,
            "weather": st.session_state.weather,
            "activities": st.session_state.activities,
            "costRange": st.session_state.cost_range,
            "currLocation": st.session_state.curr_location,
        }
        response = api_post(
            "/itineraries", body=payload, loading_text="Generating itinerary..."
        )
        if response["error"]:
            st.error(response["error"])
        else:
            result = response["data"]
            st.success("Itinerary generated!")
            st.json(result)

with tabs[1]:
    st.subheader("💬 Free-text Itinerary Query")
    prompt = st.text_area(
        "Describe your travel plans",
        placeholder="e.g. Plan me a 4-day food trip to Rome",
    )
    if st.button("Submit Query"):
        st.info("🚧 Not implemented yet - will connect to /itineraries/query later")
        st.write(f"Query submitted: {prompt}")
