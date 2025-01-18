// Helper Functions
function getData(key, defaultValue = []) {
  return JSON.parse(localStorage.getItem(key)) || defaultValue;
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Sort Helper
function sortArray(array, key, ascending = true) {
  return array.sort((a, b) => {
    if (a[key] > b[key]) return ascending ? 1 : -1;
    if (a[key] < b[key]) return ascending ? -1 : 1;
    return 0;
  });
}

// Applications Management
function getApplications() {
  return getData('applications');
}

function setApplications(applications) {
  setData('applications', applications);
}

function renderAppTable(sortKey = 'name', ascending = true) {
  const appTableBody = document.querySelector('#appTable tbody');
  const applications = getApplications();

  // Sort applications by the provided key (name or id)
  const sortedApplications = [...applications].sort((a, b) => {
    if (a[sortKey] > b[sortKey]) return ascending ? 1 : -1;
    if (a[sortKey] < b[sortKey]) return ascending ? -1 : 1;
    return 0;
  });

  appTableBody.innerHTML = ''; // Clear existing rows

  sortedApplications.forEach((app) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${app.name}</td>
      <td>${app.id}</td>
      <td>
        <div class="action-buttons">
          <button class="action-button delete-button" title="Delete" onclick="deleteApplication('${app.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    appTableBody.appendChild(row);
  });
}

function openAppForm(appId = null) {
  const appForm = document.getElementById('appForm');
  const formTitle = document.getElementById('formTitle');
  const appName = document.getElementById('appName');
  const appIdInput = document.getElementById('appIdInput');

  appForm.style.display = 'block';
  if (appId) {
    formTitle.textContent = 'Edit Application';
    const applications = getApplications();
    const app = applications.find((app) => app.id === appId);
    appName.value = app.name;
    appIdInput.value = app.id;
    appForm.dataset.appId = appId; // Store the appId for editing
  } else {
    formTitle.textContent = 'Add Application';
    appName.value = '';
    appIdInput.value = '';
    delete appForm.dataset.appId;
  }
}


function addApplication(appName, appId) {
  const applications = getApplications();
  applications.push({ name: appName, id: appId });
  setApplications(applications);
  renderAppTable();
}

function editApplication(index) {
  const applications = getApplications();
  const app = applications[index];
  document.getElementById('appNameInput').value = app.name;
  document.getElementById('appIdInput').value = app.id;

  // Update the form's submit behavior
  const addAppButton = document.querySelector('#add-app-form button[type="submit"]');
  addAppButton.textContent = 'Update';
  addAppButton.onclick = (event) => {
    event.preventDefault();
    applications[index] = {
      name: document.getElementById('appNameInput').value.trim(),
      id: document.getElementById('appIdInput').value.trim(),
    };
    setApplications(applications);
    renderAppTable();
    resetAppForm();
  };
}

function saveApplication(event) {
  event.preventDefault();

  const appName = document.getElementById('appName').value.trim();
  const appId = document.getElementById('appIdInput').value.trim();
  const applications = getApplications();
  const appForm = document.getElementById('appForm');

  if (!appName || !appId) {
    alert('Both App Name and App ID are required.');
    return;
  }

  if (appForm.dataset.appId) {
    // Edit existing application
    const index = applications.findIndex((app) => app.id === appForm.dataset.appId);
    if (index > -1) {
      applications[index] = { name: appName, id: appId };
    }
  } else {
    // Add new application
    applications.push({ name: appName, id: appId });
  }

  setApplications(applications); // Save changes
  renderAppTable(); // Refresh the app table
  populateDropdown(); // Update the dropdown
  closeAppForm(); // Hide the form
}


function deleteApplication(appId) {
  const applications = getApplications();
  const updatedApplications = applications.filter((app) => app.id !== appId);

  setApplications(updatedApplications); // Save the updated list to sessionStorage
  renderAppTable(); // Re-render the table
}


function resetAppForm() {
  document.getElementById('appNameInput').value = '';
  document.getElementById('appIdInput').value = '';
  const addAppButton = document.querySelector('#add-app-form button[type="submit"]');
  addAppButton.textContent = 'Add';
  addAppButton.onclick = null; // Reset to default submit behavior
}

// Excluded Modules Management
let excludedModules = []; // Global variable for excluded modules

function loadExcludedModules() {
  return getData('excludedModules');
}

function saveExcludedModules(modules) {
  setData('excludedModules', modules);
}

function renderExcludedModulesTable(sortKey = 'module', ascending = true) {
  const modulesTableBody = document.querySelector('#excludedModulesTable tbody');
  excludedModules = loadExcludedModules();

  // Sort the modules based on the sortKey and ascending/descending order
  const sortedModules = [...excludedModules].sort((a, b) => {
    if (a > b) return ascending ? 1 : -1;
    if (a < b) return ascending ? -1 : 1;
    return 0;
  });

  // Render the sorted table rows
  modulesTableBody.innerHTML = sortedModules
    .map(
      (module) => `
      <tr>
        <td>${module}</td>
        <td>
          <div class="action-buttons">
            <button class="action-button edit-button" title="Edit" onclick="editExcludedModule('${module}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-button delete-button" title="Delete" onclick="removeExcludedModule('${module}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`
    )
    .join('');
}



function addExcludedModule(moduleName) {
  if (!excludedModules.includes(moduleName.trim())) {
    excludedModules.push(moduleName.trim());
    saveExcludedModules(excludedModules);
    renderExcludedModulesTable();
  }
}

function removeExcludedModule(moduleName) {
  const moduleIndex = excludedModules.indexOf(moduleName);
  if (moduleIndex > -1) {
    excludedModules.splice(moduleIndex, 1); // Remove the specific module
    saveExcludedModules(excludedModules); // Save the updated list
    renderExcludedModulesTable(); // Re-render the table
  } else {
    console.warn(`Module "${moduleName}" not found in the exclusion list.`);
  }
}



// Event Listeners
document.getElementById('add-app-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const appName = document.getElementById('appNameInput').value.trim();
  const appId = document.getElementById('appIdInput').value.trim();
  if (appName && appId) {
    addApplication(appName, appId);
    resetAppForm();
  }
});

document.getElementById('add-module-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const moduleName = document.getElementById('new-module').value.trim();
  if (moduleName) addExcludedModule(moduleName);
  document.getElementById('new-module').value = '';
});

// Sortable Columns
document.querySelectorAll('#appTable th[data-sort]').forEach((th) =>
  th.addEventListener('click', () => {
    const sortKey = th.getAttribute('data-sort');
    const isAscending = th.classList.toggle('ascending');
    renderAppTable(sortKey, isAscending);
  })
);

function renderExcludedModulesTable(sortKey = 'module', ascending = true) {
  const modulesTableBody = document.querySelector('#excludedModulesTable tbody');
  excludedModules = loadExcludedModules();

  // Sort the modules based on the sortKey and ascending/descending order
  const sortedModules = [...excludedModules].sort((a, b) => {
    if (a > b) return ascending ? 1 : -1;
    if (a < b) return ascending ? -1 : 1;
    return 0;
  });

  // Render the sorted table rows
  modulesTableBody.innerHTML = ''; // Clear existing rows
  sortedModules.forEach((module) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${module}</td>
      <td>
        <div class="action-buttons">
          <button class="action-button delete-button" title="Delete" onclick="removeExcludedModule('${module}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    modulesTableBody.appendChild(row);
  });
}


// Event listener for sorting the Excluded Modules Table
document.querySelectorAll('#excludedModulesTable th[data-sort]').forEach((th) =>
  th.addEventListener('click', () => {
    const sortKey = th.getAttribute('data-sort'); // Currently, we only have one column to sort
    const isAscending = th.classList.toggle('ascending');
    renderExcludedModulesTable(sortKey, isAscending);
  })
);

function initializeApplications() {
  if (!sessionStorage.getItem('applications')) {
    sessionStorage.setItem('applications', JSON.stringify([]));
  }
}

function populateDropdown() {
  const applications = getApplications(); // Retrieve the list of applications from session storage
  const dropdown = document.getElementById('appDropdown'); // Get the dropdown element

  // Clear existing options
  dropdown.innerHTML = '<option value="">Select an Application</option>';

  // Add each application as an option in the dropdown
  applications.forEach(app => {
    const option = document.createElement('option');
    option.value = app.id; // Use App ID as the value
    option.textContent = app.name; // Display App Name in the dropdown
    dropdown.appendChild(option);
  });

  // If no applications are found, add a placeholder option
  if (applications.length === 0) {
    const noAppOption = document.createElement('option');
    noAppOption.value = '';
    noAppOption.textContent = 'No applications available';
    noAppOption.disabled = true; // Disable the placeholder option
    dropdown.appendChild(noAppOption);
  }
}






// Initialization
window.onload = () => {
  initializeApplications();
  renderAppTable();
  excludedModules = loadExcludedModules(); // Load modules into the global array
  renderExcludedModulesTable();
  populateDropdown();
};


