    const submitButton = document.getElementById('submit-btn');
    const generalLogs = document.getElementById('general-logs');
    const bulkUploadSection = document.getElementById('bulk-upload-section');
    const deleteAllButton = document.getElementById('delete-all-btn');
    const enableDeleteAllButton = () => {
      deleteAllButton.classList.remove('hidden');
    };
    

document.getElementById('download-logs').addEventListener('click', () => {
  // Get the logs from the general-logs container
  const logs = document.getElementById('general-logs').textContent;

  if (!logs.trim()) {
      alert('No logs available to download.');
      return; // Exit if there are no logs
  }

  // Create a Blob with the logs content
  const blob = new Blob([logs], { type: 'text/plain' });

  // Create a temporary link to trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;

  // Append link to the body, trigger click, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Handle the submit button click
submitButton.addEventListener('click', () => {
    const csvFile = document.getElementById('csvUpload').files[0]; // Get the uploaded file
    if (!csvFile) {
        generalLogs.textContent += 'Error: Please upload a CSV file.\n'; // Display error if no file is uploaded
        return;
    }

    // Create a new FormData instance for the upload
    const uploadData = new FormData();
    uploadData.append('csvUpload', csvFile);
    uploadData.append('appId', document.getElementById('appId').value); // Get App ID from input

    // Pass the FormData and excludedModules to the handler
    handleCsvUpload(uploadData, excludedModules, operationId);
});
// Handle the Delete All button click
deleteAllButton.addEventListener('click', () => {
  // Retrieve the App ID and Branch Name from the input fields
  const appId = document.getElementById('appId').value;
  const branchName = document.getElementById('branchName').value;

  // Check if both App ID and Branch Name are provided
  if (!appId || !branchName) {
    generalLogs.textContent += 'Error: App ID and Branch Name are required for deletion.\n';
    return; // Exit the function if required fields are missing
  }

  // Initialize an array to hold the items to be deleted
  const items = [];
  
  // Collect the items from the preview table
  const rows = document.querySelectorAll('#preview-table tbody tr');
  rows.forEach((row) => {
    if (row.children.length >= 3) { // Ensure there are enough children
        const moduleName = row.children[0].textContent; // Get the module name from the first column
        const itemName = row.children[1].textContent;   // Get the item name from the second column
        const itemType = row.children[2].textContent;   // Get the item type from the third column
        items.push({ moduleName, itemName, itemType }); // Push the item details into the items array
    } else {
        console.warn('Row does not have enough children:', row); // Warn if the row structure is not as expected
    }
  });
  
  // Confirm that there are items to delete
  if (items.length === 0) {
    generalLogs.textContent += 'Error: No items found to delete.\n';
    return; // Exit if no items to process
  }

  // Send a POST request to the server to delete the items in bulk
fetch('/delete-bulk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', // Specify the content type as JSON
  },
  body: JSON.stringify({ appId, branchName, items, operationId }), // Send the App ID, Branch Name, and items as JSON
})
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); // Parse the JSON response from the server
  })
  .then((data) => {
    generalLogs.textContent += 'Deletion process started...\n'; // Log that the deletion process has started

    // Safely iterate over the results returned from the server
    if (Array.isArray(data.results)) {
      data.results.forEach(({ itemName, status }) => {
        generalLogs.textContent += `${itemName}: ${status}\n`; // Log the status of each deleted item
      });
    } else {
      generalLogs.textContent += 'Error: No results found in server response.\n';
    }

    generalLogs.textContent += 'Deletion process completed.\n'; // Log that the deletion process has completed
  })
  .catch((error) => {
    generalLogs.textContent += `Error during deletion: ${error.message}\n`; // Display the error message in the logs
  });

});


// Function to update excludedModules from user input
function updateExcludedModules(modules) {
  excludedModules = modules.map((module) => module.trim()); // Trim whitespace for each module
  console.log('Updated Excluded Modules:', excludedModules);
}


  // Syntax highlighting for JSON
function syntaxHighlight(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2); // Format JSON with indentation
    }
    json = json.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
        (match) => {
            let cls = 'number'; // Default class
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key'; // JSON keys
                } else {
                    cls = 'string'; // JSON strings
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean'; // JSON booleans
            } else if (/null/.test(match)) {
                cls = 'null'; // JSON null
            }
            return `<span class="${cls}">${match}</span>`;
        }
    );
    return `<pre>${json}</pre>`; // Wrap in <pre> for proper formatting
  }


  function handleAppSelection() {
    const dropdown = document.getElementById('appDropdown'); // Get the dropdown element
    const appIdInput = document.getElementById('appId'); // Get the App ID input field
  
    // Add an event listener for dropdown changes
    dropdown.addEventListener('change', () => {
      const selectedAppId = dropdown.value; // Get the selected App ID
      appIdInput.value = selectedAppId; // Set the App ID input value
    });
  }
  
  // Call this function after the dropdown is populated
  populateDropdown();
  handleAppSelection();
  