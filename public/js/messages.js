const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Connect to the SSE endpoint
const eventSource = new EventSource(`/stream-logs?operationId=${operationId}`);

// Listen for messages from the server
let totalItems = document.querySelectorAll('#preview-table tbody tr').length; // Get total items from table rows
let processedItems = 0;
const startTime = Date.now();

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const generalLogs = document.getElementById('general-logs');

    // Determine how to display the message based on the type
    let logMessage = '';
    if (data.type === 'json') {
        // Format JSON data
        logMessage = `${syntaxHighlight(data.message)}`;
    } else {
        // Regular log messages
        logMessage = `<span>${data.message}</span>`;
    }

    // Append the formatted message
    generalLogs.innerHTML += `${logMessage}<br/>`;

    // Update processed items
    if (data.message.includes('Processed item:')) {
        processedItems++;
        console.log(`Processed items: ${processedItems} of ${totalItems}`);
    }

    // Scroll to the bottom of the logs container
    generalLogs.scrollTop = generalLogs.scrollHeight;
};

// Handle errors
eventSource.onerror = (error) => {
    const generalLogs = document.getElementById('general-logs');
    generalLogs.innerHTML += '<span class="error">Error occurred while streaming logs. Please try again.</span><br/>';
    console.error('An error occurred while streaming logs.', error);
    eventSource.close();
};
