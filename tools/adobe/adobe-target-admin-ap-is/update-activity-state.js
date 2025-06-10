/**
 * Function to update the state of an activity in Adobe Target.
 *
 * @param {Object} args - Arguments for updating the activity state.
 * @param {string} args.tenant - The tenant identifier.
 * @param {string} args.state - The new state to set for the activity.
 * @returns {Promise<Object>} - The result of the activity state update.
 */
const executeFunction = async ({ tenant, state }) => {
  const baseUrl = 'https://mc.adobe.io';
  const apiKey = process.env.ADOBE_API_KEY;
  const token = process.env.ADOBE_API_KEY;

  try {
    // Construct the URL for the request
    const url = `${baseUrl}/${tenant}/target/activities/ab/168816/state`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Api-Key': apiKey,
      'Content-Type': 'application/vnd.adobe.target.v1+json'
    };

    // Set up the body of the request
    const body = JSON.stringify({ state });

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating activity state:', error);
    return { error: 'An error occurred while updating the activity state.' };
  }
};

/**
 * Tool configuration for updating activity state in Adobe Target.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_activity_state',
      description: 'Update the state of an activity in Adobe Target.',
      parameters: {
        type: 'object',
        properties: {
          tenant: {
            type: 'string',
            description: 'The tenant identifier.'
          },
          state: {
            type: 'string',
            description: 'The new state to set for the activity.'
          }
        },
        required: ['tenant', 'state']
      }
    }
  }
};

export { apiTool };