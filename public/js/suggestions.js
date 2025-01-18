
document.getElementById('branchName').addEventListener('focus', () => {
  showRecentBranches();
});


document.addEventListener('click', (event) => {
  const suggestions = document.getElementById('branchSuggestions');
  const input = document.getElementById('branchName');
  if (!suggestions.contains(event.target) && event.target !== input) {
      suggestions.style.display = 'none';
  }
});

document.getElementById('branchName').addEventListener('blur', () => {
  const branchName = document.getElementById('branchName').value.trim();
  if (branchName) saveBranchName(branchName);
});

 
function saveBranchName(branchName) {
    const recentBranches = JSON.parse(sessionStorage.getItem('recentBranches')) || [];
    if (!recentBranches.includes(branchName)) {
        recentBranches.unshift(branchName); // Add to the start
        if (recentBranches.length > 5) recentBranches.pop(); // Limit to 5 items
        sessionStorage.setItem('recentBranches', JSON.stringify(recentBranches));
    }
}

function showRecentBranches() {
  const input = document.getElementById('branchName');
  const suggestions = document.getElementById('branchSuggestions');
  const recentBranches = JSON.parse(sessionStorage.getItem('recentBranches')) || [];
  const query = input.value.trim().toLowerCase(); // Trim and lowercase input

  // Clear previous suggestions
  suggestions.innerHTML = '';

  if (recentBranches.length > 0) {
      const filteredBranches = query
          ? recentBranches.filter(branch => branch.toLowerCase().includes(query))
          : recentBranches; // Show all if no query

      filteredBranches.forEach(branch => {
          const li = document.createElement('li');

          // Branch name
          const span = document.createElement('span');
          span.textContent = branch;
          span.onclick = () => {
              input.value = branch; // Set input value to selected branch
              suggestions.style.display = 'none'; // Hide suggestions
          };

          // Delete button
          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'X';
          deleteButton.onclick = (event) => {
              event.stopPropagation(); // Prevent triggering row click
              deleteBranch(branch); // Remove branch from recent list
          };

          li.appendChild(span); // Add branch name
          li.appendChild(deleteButton); // Add delete button
          suggestions.appendChild(li); // Add row to suggestions
      });

      // Show suggestions only if there are matches
      suggestions.style.display = filteredBranches.length > 0 ? 'block' : 'none';
  } else {
      // Hide suggestions if no branches exist
      suggestions.style.display = 'none';
  }
}

function deleteBranch(branchName) {
    let recentBranches = JSON.parse(sessionStorage.getItem('recentBranches')) || [];
    recentBranches = recentBranches.filter(branch => branch !== branchName);
    sessionStorage.setItem('recentBranches', JSON.stringify(recentBranches));
    showRecentBranches(); // Refresh the suggestions
}