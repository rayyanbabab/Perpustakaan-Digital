// src/lib/googleApi.ts

/**
 * Mengirim data ke Web App Google Apps Script (POST)
 */
export async function sendDataToGas(url: string, payload: any) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error sending data to GAS:', error);
    throw error;
  }
}

/**
 * Mengambil data dari Web App Google Apps Script (GET)
 */
export async function fetchDataFromGas(url: string) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    throw error;
  }
}
