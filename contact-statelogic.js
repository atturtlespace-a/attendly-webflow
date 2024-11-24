// This code is used for contact page only. It works based on US States and Counties API

async function fetchStates(url) {
    try {
      //console.log("Fetching states from URL:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      //console.log("States fetched successfully:", Object.keys(data));
      return data; // Return the full data object
    } catch (error) {
      //console.error("Error fetching states data:", error);
      return {};
    }
  }
  
  function autocomplete(inputElement, suggestions) {
    if (!Array.isArray(suggestions)) {
      //console.error("Suggestions must be an array:", suggestions);
      return;
    }
  
    let currentFocus = -1;
  
    inputElement.addEventListener("input", function () {
      const val = this.value;
      //console.log("Input event triggered. Current value:", val);
      closeAllLists();
      if (!val) return;
  
      const listContainer = document.createElement("div");
      listContainer.setAttribute("id", this.id + "-autocomplete-list");
      listContainer.setAttribute("class", "autocomplete-items");
      this.parentNode.appendChild(listContainer);
  
      suggestions.forEach((suggestion) => {
        if (suggestion.toUpperCase().startsWith(val.toUpperCase())) {
          const suggestionItem = document.createElement("div");
          suggestionItem.innerHTML = `
            <strong>${suggestion.substr(0, val.length)}</strong>${suggestion.substr(val.length)}
            <input type='hidden' value='${suggestion}'>
          `;
  
          suggestionItem.addEventListener("click", function () {
            //console.log("Suggestion clicked. Selected value:", suggestion);
            inputElement.value = this.querySelector("input").value;
            closeAllLists();
  
            if (inputElement.id === "state-name") {
              handleStateSelection(inputElement.value, suggestions); // Trigger state handling
            }
          });
  
          listContainer.appendChild(suggestionItem);
        }
      });
    });
  
    inputElement.addEventListener("keydown", function (e) {
      let items = document.querySelectorAll("#" + this.id + "-autocomplete-list div");
      if (items.length === 0) return;
  
      if (e.key === "ArrowDown") {
        currentFocus++;
        addActive(items);
      } else if (e.key === "ArrowUp") {
        currentFocus--;
        addActive(items);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentFocus > -1) {
          items[currentFocus].click();
        }
      }
    });
  
    function addActive(items) {
      removeActive(items);
      if (currentFocus >= items.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = items.length - 1;
      items[currentFocus]?.classList.add("autocomplete-active");
    }
  
    function removeActive(items) {
      items.forEach((item) => item.classList.remove("autocomplete-active"));
    }
  
    function closeAllLists(except) {
      document.querySelectorAll(".autocomplete-items").forEach((list) => {
        if (list !== except) list.remove();
      });
    }
  
    document.addEventListener("click", function (e) {
      closeAllLists(e.target);
    });
  }
  

function handleStateSelection(stateInput, suggestions) {
    const districtDiv = document.querySelector('[data-condition="district"]');
    const countiesInput = document.querySelector('[data-autofill="counties"]');
  
   // console.log("Handling state selection for input:", stateInput);
    const normalizedState = stateInput.trim().toLowerCase();
    const matchedState = suggestions.find(
      (state) => state.toLowerCase() === normalizedState
    );
  
    if (matchedState) {
    //  console.log("Valid state selected:", matchedState);
  
      // Enable district div and fetch counties
      districtDiv.classList.remove("is--disable-zero");
      fetchAndLogCounties(datasetUrl, matchedState).then((counties) => {
        if (Array.isArray(counties) && counties.length > 0) {
        //  console.log("Setting up autocomplete for counties:", counties);
  
          // Set up autocomplete for counties input
          countiesInput.value = ""; // Reset the current value of the counties input
          autocomplete(countiesInput, counties);
        } else {
        //  console.error("No counties found or counties data invalid:", counties);
          countiesInput.value = ""; // Reset counties input
          districtDiv.classList.add("is--disable-zero");
        }
      });
    } else {
     // console.log("Invalid state. Disabling district field and resetting counties input.");
  
      // Reset counties input and disable district div
      districtDiv.classList.add("is--disable-zero");
      if (countiesInput) countiesInput.value = ""; // Clear counties input value
    }
  }
  
  
  async function fetchAndLogCounties(url, stateInput) {
    try {
    //  console.log("Fetching counties for state:", stateInput);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
  
      const normalizedState = stateInput.trim().toLowerCase();
      const matchedState = Object.keys(data).find(
        (state) => state.toLowerCase() === normalizedState
      );
  
      if (matchedState) {
        const countiesObject = data[matchedState];
   //     console.log(`Counties in ${matchedState}:`, countiesObject);
  
        // Extract keys (county names), remove "County" and the state name
        const countiesArray = Object.keys(countiesObject).map((county) =>
          county.replace("County", "").replace(`, ${matchedState}`, "").trim() // Remove "County" and state
        );
  
       // console.log(`Processed counties for ${matchedState}:`, countiesArray);
        return countiesArray; // Return cleaned array of county names
      } else {
      //  console.log(`State "${stateInput}" not found in the dataset.`);
        return [];
      }
    } catch (error) {
    //  console.error("Error fetching counties data:", error);
      return [];
    }
  }
  
  
  
  // Fetch states and initialize autocomplete
const datasetUrl = "https://cdn.jsdelivr.net/gh/balsama/us_counties_data@main/data/counties_by_state.json";

fetchStates(datasetUrl).then((data) => {
  const states = Object.keys(data); // Extract state names
 // console.log("Initializing autocomplete with states:", states);

  const stateInput = document.getElementById("state-name");

  // Add input event to reset counties when state is edited
  stateInput.addEventListener("input", function () {
    const value = this.value.trim();
  //  console.log("State input changed. Resetting counties field. Current value:", value);

    // Reset the counties field and disable it until a valid state is selected
    const countiesInput = document.querySelector('[data-autofill="counties"]');
    const districtDiv = document.querySelector('[data-condition="district"]');
    countiesInput.value = ""; // Clear counties input
    districtDiv.classList.add("is--disable-zero"); // Disable district div
  });

  autocomplete(stateInput, states);
});




document.addEventListener("DOMContentLoaded", function() {
    // Initial setup
    const countryData = window.intlTelInputGlobals.getCountryData();
    const inputPhone = document.querySelector("#number");
    const dialCode = document.querySelector("#dialCode");
    const hiddenCountryName = document.getElementById("hiddenCountryName");
  
    // Init phone input with updated utilsScript
    const iti = window.intlTelInput(inputPhone, {
      utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.2.1/build/js/utils.js",
      initialCountry: "us"
    });
  
    // Initial values
    dialCode.value = "+" + iti.getSelectedCountryData().dialCode;
    hiddenCountryName.value = iti.getSelectedCountryData().name;
  
    // Country changes from phone input affect dialCode
    inputPhone.addEventListener('countrychange', () => {
      dialCode.value = "+" + iti.getSelectedCountryData().dialCode;
      hiddenCountryName.value = iti.getSelectedCountryData().name;
    });
  });
