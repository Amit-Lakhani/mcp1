/**
 * Function to update the activity schedule in Adobe Target.
 *
 * @param {Object} args - Arguments for the update.
 * @param {string} args.tenant - The tenant identifier.
 * @param {string} args.startsAt - The start time of the activity in ISO 8601 format.
 * @param {string} args.endsAt - The end time of the activity in ISO 8601 format.
 * @returns {Promise<Object>} - The result of the update operation.
 */
const executeFunction = async ({ tenant, startsAt, endsAt }) => {
  const baseUrl = 'https://mc.adobe.io';
  const token = process.env.ADOBE_API_KEY;
  const apiKey = process.env.ADOBE_API_KEY;

  try {
    // Construct the URL for the request
    const url = `${baseUrl}/${tenant}/target/activities/ab/168816/schedule`;

    // Set up headers for the request
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Api-Key': apiKey,
      'Content-Type': 'application/vnd.adobe.target.v1+json'
    };

    // Prepare the body of the request
    const body = JSON.stringify({
      startsAt,
      endsAt
    });

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
    console.error('Error updating activity schedule:', error);
    return { error: 'An error occurred while updating the activity schedule.' };
  }
};

/**
 * Tool configuration for updating the activity schedule in Adobe Target.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'update_activity_schedule',
      description: 'Update the activity schedule in Adobe Target.',
      parameters: {
        type: 'object',
        properties: {
          tenant: {
            type: 'string',
            description: 'The tenant identifier.'
          },
          startsAt: {
            type: 'string',
            description: 'The start time of the activity in ISO 8601 format.'
          },
          endsAt: {
            type: 'string',
            description: 'The end time of the activity in ISO 8601 format.'
          }
        },
        required: ['tenant', 'startsAt', 'endsAt']
      }
    }
  }
};

export { apiTool };