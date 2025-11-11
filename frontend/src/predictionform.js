import React, { useState } from 'react';

// This is an object that holds the default "empty" state for our form
const initialFormState = {
  TransactionAmt: '',
  card1: '',
  card2: '',
  card3: '',
  card4: '',
  card5: '',
  addr1: '',
  addr2: '',
};

// 1. You CORRECTLY accepted the prop here
function PredictionForm({ onPredictionSuccess }) {
  // 'formData' holds what the user has typed.
  const [formData, setFormData] = useState(initialFormState);

  // 'result' will hold the response from our API.
  const [result, setResult] = useState(null);

  // 'error' will hold any error messages.
  const [error, setError] = useState(null);

  // This function updates formData as the user types
  const handleChange = (e) => { // NOTE: I removed 'async' here, it's not needed
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // This function runs when the user clicks "Submit"
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from reloading
    setResult(null); // Clear old results
    setError(null);

    // This is the data we will send to the API
    const dataToSend = {
      TransactionAmt: parseFloat(formData.TransactionAmt),
      card1: parseFloat(formData.card1) || 0,
      card2: parseFloat(formData.card2) || 0,
      card3: parseFloat(formData.card3) || 0,
      card4: formData.card4 || "", // card4 is a string
      card5: parseFloat(formData.card5) || 0,
      addr1: parseFloat(formData.addr1) || 0,
      addr2: parseFloat(formData.addr2) || 0,
    };

    try {
      // Talk to our FastAPI backend!
      const response = await fetch('https://fraud-api-h8ty.onrender.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResult(data); // Save the prediction
      setFormData(initialFormState); // Clear the form
      
      onPredictionSuccess(); 

    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to get prediction. Is the backend running?');
    }
  };

  // ... (The rest of your return() code is perfect) ...
  // This is the HTML-like code that React renders
  return (
    <div className="prediction-form">
      <form onSubmit={handleSubmit}>
        
        {/* We can map over the keys to create labels and inputs */}
        {Object.keys(initialFormState).map((key) => (
          <div className="form-group" key={key}>
            <label htmlFor={key}>{key}</label>
            <input
              type={key === 'card4' ? 'text' : 'number'}
              id={key}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              placeholder={key === 'card4' ? 'e.g., visa' : '0.0'}
              required={key === 'TransactionAmt'} // Only TransactionAmt is required
            />
          </div>
        ))}
        
        <button type="submit" className="submit-button">Predict</button>
      </form>

      {/* This section shows the API's response */}
      {result && (
        <div className={`result-box ${result.fraud_likely ? 'fraud' : 'not-fraud'}`}>
          <strong>Prediction: {result.fraud_likely ? 'FRAUD 🚨' : 'Not Fraud ✅'}</strong>
          <p>Probability: {result.probability.toFixed(4)}</p>
        </div>
      )}
      
      {/* This section shows any errors */}
      {error && (
        <div className="result-box error">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default PredictionForm;