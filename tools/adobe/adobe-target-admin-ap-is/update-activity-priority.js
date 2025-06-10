/**
 * Function to update the priority of an activity in Adobe Target.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.tenant - The tenant identifier.
 * @param {string} args.priority - The new priority value for the activity.
 * @returns {Promise<Object>} - The result of the update operation.
 */
const executeFunction = async ({ tenant, priority }) => {
  const baseUrl = 'https://mc.adobe.io';
  const token = process.env.ADOBE_API_KEY;
  const apiKey = process.env.ADOBE_API_KEY;

  try {
    // Construct the URL for the request
    const url = `${baseUrl}/${tenant}/target/activities/ab/168816/priority`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Api-Key': apiKey,
      'Content-Type': 'application/vnd.adobe.target.v1+json'
    };

    // Prepare the body data for the request
    const body = JSON.stringify({ priority });

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
    console.error('Error updating activity priority:', error);
    return { error: 'An error occurred while updating activity priority.' };
  }
};

/**
 * Tool configuration for updating activity priority in Adobe Target.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_activity_priority',
      description: 'Update the priority of an activity in Adobe Target.',
      parameters: {
        type: 'object',
        properties: {
          tenant: {
            type: 'string',
            description: 'The tenant identifier.'
          },
          priority: {
            type: 'string',
            description: 'The new priority value for the activity.'
          }
        },
        required: ['tenant', 'priority']
      }
    }
  }
};

export { apiTool };