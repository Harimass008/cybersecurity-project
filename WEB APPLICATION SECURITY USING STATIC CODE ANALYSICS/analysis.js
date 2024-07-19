window.onload = function() {
  const analysisResult = document.getElementById('analysisResult');
  const results = JSON.parse(localStorage.getItem('analysisResults'));

  if (results) {
    // Create a table for displaying the results
    let table = `
      <table>
        <thead>
          <tr>
            <th>Line</th>
            <th>Line Content</th>
            <th>Description</th>
            <th>Severity</th>
            <th>Recommendation</th>
            <th>Occurrences</th>
          </tr>
        </thead>
        <tbody>
    `;

    results.forEach(result => {
      table += `
        <tr>
          <td>${result.line}</td>
          <td>${result.lineContent}</td>
          <td>${result.description}</td>
          <td>${result.severity}</td>
          <td>${result.recommendation}</td>
          <td>${result.occurrences}</td>
        </tr>
      `;
    });

    table += `
        </tbody>
      </table>
    `;

    analysisResult.innerHTML = table;
  } else {
    analysisResult.textContent = 'No results found. Please upload a file and scan it first.';
  }
};
