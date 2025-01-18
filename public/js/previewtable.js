const previewContainer = document.getElementById('preview-container');
const previewTableBody = document.querySelector('#preview-table tbody');

// Function to handle the CSV upload
// Function to handle CSV upload
function handleCsvUpload(uploadData, excludedModules, operationId) {
  const loadingIcon = document.getElementById('loading-icon');
  const previewContainer = document.getElementById('preview-container'); // Add a container for the summary

  // Show the loading icon
  loadingIcon.style.display = 'block';

  uploadData.append('operationId', operationId); // Include operationId in the payload

  
  fetch('/parse-csv', {
      method: 'POST',
      headers: {
          'excluded-modules': JSON.stringify(excludedModules), // Send excluded modules as a header
      },
      body: uploadData,
  })
      .then((response) => {
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
      })
      .then((data) => {
          // Clear the preview table and display it
          previewContainer.classList.remove('hidden');
          previewTableBody.innerHTML = '';

          // Populate the preview table with parsed data
          if (Array.isArray(data.results)) {
              data.results.forEach(({ moduleName, itemName, itemType }) => {
                  const uniqueId = `${moduleName}-${itemName}-${itemType}`;
                  const row = document.createElement('tr');
                  row.innerHTML = `
                      <td>${moduleName}</td>
                      <td>${itemName}</td>
                      <td>${itemType}</td>
                      <td>
                           <button class="action-button remove-item" data-unique-id="${uniqueId}"><i class="fas fa-eraser"></i></button>
                      </td>
                  `;
                  previewTableBody.appendChild(row);
              });

              attachRemoveItemEvent(data.results); // Attach delete functionality
              enableDeleteAllButton(); // Enable Delete All button
          }

          generalLogs.textContent += '\nCSV parsed and preview displayed.\n';
      })
      .catch((error) => {
          console.error('Error parsing CSV:', error);
          generalLogs.textContent += `Error parsing CSV file: ${error.message}\n`;
      })
      .finally(() => {
          // Hide the loading icon
          loadingIcon.style.display = 'none';
      });
}

  
// Function to re-render the preview table
function renderPreviewTable(results, skipSort = false) {
  previewTableBody.innerHTML = ''; // Clear existing rows
  results.forEach(({ moduleName, itemName, itemType }) => {
    const uniqueId = `${moduleName}-${itemName}-${itemType}`;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${moduleName}</td>
      <td>${itemName}</td>
      <td>${itemType}</td>
      <td>
        <button class="action-button remove-item" data-unique-id="${uniqueId}"><i class="fas fa-eraser"></i></button>
      </td>
    `;
    previewTableBody.appendChild(row);
  });

  if (!skipSort && currentSort.column !== null) {
    sortTableByColumn(currentSort.column, currentSort.direction);
  }

  attachRemoveItemEvent(results);
}

// Function to handle delete button clicks
function attachRemoveItemEvent(results) {
  const removePreviewItem = document.querySelectorAll('.remove-item');
  removePreviewItem.forEach((button) => {
    button.addEventListener('click', (e) => {
      const uniqueId = e.target.dataset.uniqueId;
      const itemIndex = results.findIndex(
        (item) => `${item.moduleName}-${item.itemName}-${item.itemType}` === uniqueId
      );
      if (itemIndex !== -1) {
        results.splice(itemIndex, 1); // Remove item
        renderPreviewTable(results, true); // Skip sorting after deletion
      }
    });
  });
}

  // Add click event listeners for sorting columns
  document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('#preview-table th');
    headers.forEach((header, index) => {
      header.addEventListener('click', () => {
        const newDirection = currentSort.column === index && currentSort.direction === 'asc' ? 'desc' : 'asc';
        sortTableByColumn(index, newDirection);
      });
    });
  });
  

  // Track the current sort state
let currentSort = { column: null, direction: null };

// Function to handle sorting
function sortTableByColumn(columnIndex, direction) {
  const rows = Array.from(previewTableBody.rows);
  const multiplier = direction === 'asc' ? 1 : -1;

  rows.sort((a, b) => {
    const aText = a.cells[columnIndex].textContent.trim();
    const bText = b.cells[columnIndex].textContent.trim();
    return aText.localeCompare(bText) * multiplier;
  });

  // Clear and re-add sorted rows
  previewTableBody.innerHTML = '';
  rows.forEach((row) => previewTableBody.appendChild(row));

  // Update the current sort state
  currentSort = { column: columnIndex, direction };
}
