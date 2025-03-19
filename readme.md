# Xemble Explanation Questionnaire - Technical Guide

## Overview
This project implements a dynamic questionnaire to evaluate AI explanations. The main HTML file ([index.html](index.html)) uses Vue.js for state management, dynamic UI transitions, and answer collection throughout several phases.

## Questionnaire Implementation (index.html)
- Uses Vue.js (v3.3.4) to manage multiple survey phases:
  - **Consent Screen:** Asks for user consent.
  - **Training Section:** Provides a practice question to explain the answering mechanism.
  - **Information Screen:** Offers details about the survey and dataset.
  - **Survey Questions:** Presents sample data with two explanation methods ("Xemble" and "SHAP") side by side.
  - **Dynamic UI:** Allows toggling of additional information (detailed model metrics or SHAP values) and tracks answer timings.
  - **Review Phase:** Enables users to provide qualitative feedback via open-ended questions before final submission.
- The application fetches its dataset JSON from a remote GitHub URL, ensuring consistency with local data.

## Data Structure (data new.json)
The dataset JSON used in the questionnaire (fetched from the GitHub URL) includes:
- **datasets:** An array of dataset objects. Each dataset contains:
  - **name & complexity:** Metadata about the dataset.
  - **samples:** An array of sample objects with:
    - **id:** Sample identifier.
    - **features:** An object of key-value pairs representing sample features.
    - **ground_truth & model_prediction:** The expected and predicted outcomes.
    - **confidence:** A numerical confidence score.
    - **explanations:** Contains two methods:
      - **Xemble:** 
        - *additional_info:* An array detailing predictions from various models (includes model name, vote, accuracy, and confidence).
        - *text:* A textual explanation summarizing the ensemble decision.
      - **SHAP:**
        - *shap_values:* An array indicating the influence of individual features (feature and value).
        - *text:* A detailed narrative explaining feature contributions.
- **questions:** An array of survey questions (typically Likert scale or multiple choice) that evaluate aspects such as clarity, trust, and comprehensibility.
- **reviewQuestions:** An array of open-ended questions for qualitative feedback during the review phase.

The corresponding fetching line is:
````javascript
fetch('https://raw.githubusercontent.com/ronbenshimol/xemble-prolific/refs/heads/main/data.json?v=5.0')
````

## Running and Customization
- On launch, index.html fetches the JSON data and randomly selects a dataset to display limited samples.
- The UI allows users to interact with explanations, switch views, and submit ratings.
- You can modify survey questions or dataset samples by editing the respective arrays in "data new.json".

## Integration with Prolific
- The application integrates with Prolific by extracting required URL parameters: `PROLIFIC_PID`, `SESSION_ID`, and `STUDY_ID`.  
- These parameters are validated and stored upon initialization and are passed as metadata during survey submission via API calls.  
- Example: The final survey submission sends a POST request including these parameters to the designated API endpoint.

TODO: At the end of the study, participants need to enter a completion code on Prolific to show they have completed the study. Redirect participants back to Prolific using a URL.It is very important to inform participants in advance that they need to click the "Finish" button to complete the study. Provide them with the URL link for this purpose.

## Google Sheet Script Integration

The file [googleSheetScript.js](googleSheetScript.js) is used to save submission data from the questionnaire (index.html) into a Google Sheet. It works by:
- Handling POST requests sent when the questionnaire is finished.
- Verifying required URL parameters and checking for duplicate submissions using the participant's PROLIFIC_PID.
- Appending a new row to the Google Sheet with a timestamp and all form data.
- Returning a JSON response indicating success or any errors encountered.

TODO: in order to use this script. once should change the structure of the sent data in the questionaire app so the data sent to google sheets will be flat and all the parameters wil have a unique name.
more information on how to deploy the sctipt to google sheets:
https://github.com/levinunnink/html-form-to-google-sheet?tab=readme-ov-file
