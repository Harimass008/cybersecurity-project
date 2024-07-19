document.getElementById('scanButton').addEventListener('click', () => {
  const language = document.getElementById('languageSelect').value;
  const files = document.getElementById('fileInput').files;
  if (files.length === 0) {
    alert('Please select a file to scan.');
    return;
  }

  const rulesFile = `${language}_rules.json`;

  // Read and analyze the uploaded files
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const content = event.target.result;
      analyzeFile(content, file.name, rulesFile);
    };
    reader.readAsText(file);
  }
});

async function analyzeFile(content, fileName, rulesFile) {
  try {
    // Fetch the JSON rules
    const response = await fetch(rulesFile);

    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
    }

    const { rules } = await response.json();

    // Analyze the file content based on the rules
    const results = rules.flatMap(rule => {
      const regex = new RegExp(rule.pattern, 'g');
      const lines = content.split('\n');
      return lines.map((line, index) => {
        const matches = line.match(regex);
        return matches ? {
          file: fileName,
          ruleId: rule.id,
          description: rule.description,
          severity: rule.severity,
          recommendation: rule.recommendation,
          occurrences: matches.length,
          line: index + 1,
          lineContent: line
        } : null;
      }).filter(result => result !== null);
    });

    results.sort((a, b) => a.line - b.line);

    // Store results in local storage
    localStorage.setItem('analysisResults', JSON.stringify(results));
    // Redirect to the Analysis page
    window.location.href = 'analysis.html';
  } catch (error) {
    console.error('Error analyzing files:', error);
  }
}
