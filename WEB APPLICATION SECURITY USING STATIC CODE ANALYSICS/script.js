document.getElementById('scanButton').addEventListener('click', () => {
    const files = document.getElementById('fileInput').files;
    if (files.length === 0) {
      alert('Please select a file to scan.');
      return;
    }
  
    // Read and analyze the uploaded files
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const content = event.target.result;
        analyzeFile(content, file.name);
      };
      reader.readAsText(file);
    }
  });
  
  async function analyzeFile(content, fileName) {
    try {
      // Fetch the JSON rules
      const response = await fetch('custom_rules.json');
      const { rules } = await response.json();
  
      // Analyze the file content based on the rules
      const results = rules.map(rule => {
        const regex = new RegExp(rule.pattern, 'g');
        const matches = content.match(regex);
        return matches ? {
          file: fileName,
          ruleId: rule.id,
          description: rule.description,
          severity: rule.severity,
          recommendation: rule.recommendation,
          occurrences: matches.length
        } : null;
      }).filter(result => result !== null);
  
      // Display the results
      displayResults(results);
    } catch (error) {
      console.error('Error analyzing files:', error);
    }
  }
  
  function displayResults(results) {
    const analysisResult = document.getElementById('analysisResult');
    analysisResult.textContent = JSON.stringify(results, null, 2);
  }
  