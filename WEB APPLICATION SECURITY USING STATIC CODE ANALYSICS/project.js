document.addEventListener("DOMContentLoaded", () => {
    localStorage.clear();

    const uploadButtons = document.querySelectorAll(".card__button");

    uploadButtons.forEach(button => {
        button.addEventListener("click", (event) => {
            const card = event.target.closest('.card__data');
            const fileInput = card.querySelector('.file-input');
            fileInput.click();
        });
    });

    const fileInputs = document.querySelectorAll(".file-input");

    fileInputs.forEach(input => {
        input.addEventListener("change", (event) => {
            const file = event.target.files[0];
            const card = event.target.closest('.card__data');
            const expectedType = card.querySelector('.card__button').dataset.type;

            if (file) {
                const fileExtension = getFileExtension(file.name).toLowerCase();
                const isValidType = validateFileType(fileExtension, expectedType);

                if (!isValidType) {
                    alert("Invalid file type. Please upload the correct file.");
                } else {
                    alert(`File ${file.name} uploaded successfully!`);
                    analyzeFile(file, expectedType);
                }
                event.target.value = "";
            }        });
    });


function getFileExtension(fileName) {
    return fileName.split('.').pop();
}

function validateFileType(fileExtension, expectedType) {
    const fileTypeMapping = {
        'js': 'js',
        'java': 'java',
        'py': 'py',
        'html': 'html',
        'ts':'ts',
        'cpp': 'cpp',
        'swift': 'swift',
        'c': 'c',
        'go': 'go',
        'ruby': 'ruby',
        'php': 'php',
        'dart': 'dart',
        'vb': 'vb',
        'rb': 'rb',
        'pl': 'pl',
        'sql': 'sql'
    };

    return fileTypeMapping[fileExtension] === expectedType;
}

function analyzeFile(file, fileType) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const content = event.target.result;
        const rulesFile = `${fileType}_rules.json`;

        fetchRulesAndAnalyze(content, file.name, rulesFile);
    };
    reader.readAsText(file);
}

async function fetchRulesAndAnalyze(content, fileName, rulesFile) {
    try {
        const response = await fetch(rulesFile);

        if (!response.ok) {
            throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
        }

        const rulesObject = await response.json();

        let rules = [];
        if (Array.isArray(rulesObject)) {
            rules = rulesObject;
        } else if (rulesObject.rules && Array.isArray(rulesObject.rules)) {
            rules = rulesObject.rules;
        } else {
            throw new Error("Fetched rules are not an array");
        }

        const results = analyzeContent(content, fileName, rules);
       

        // Store both the original and corrected code in localStorage
        localStorage.setItem('fileContent', content);
        localStorage.setItem('analysisResults', JSON.stringify(results));
    

        window.location.href = 'analysis_result.html';
    } catch (error) {
        console.error('Error analyzing files:', error);
    }
}



async function callGeminiApiForFix(content, line, positiveExample) {
    try {
        const response = await fetch('https://api.gemini.com/fix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content,
                line,
                positiveExample
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch fix: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.fixedCode;
    } catch (error) {
        console.error('Error fetching fix:', error);
        return null;
    }
}

function analyzeContent(content, fileName, rules) {
    return rules.reduce((acc, rule) => {
        if (!rule.examples.negative || rule.examples.negative.length === 0) {
            console.warn(`Rule ${rule.title} has no negative examples.`);
            return acc;
        }

        rule.examples.negative.forEach(example => {
            const regex = new RegExp(example.pattern, 'g');
            const lines = content.split('\n');

            console.log(`Checking for rule: ${rule.title}`);

            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) {
                    return;
                }
                const matches = line.match(regex);

                if (matches) {
                    console.log(`Match found for rule: ${rule.title} on line ${index + 1}`);
                    acc.push({
                        ruleId: rule.id,
                        title: rule.title,
                        description: rule.description,
                        impact: rule.impact,
                        category: rule.category,
                        tags: rule.tags,
                        severity: rule.severity,
                        cwe: rule.cwe,
                        Reference_link: rule.Reference_link,
                        examples: rule.examples,
                        fix: rule.fix,
                        rationale: rule.rationale,
                        line: index + 1,
                        lineContent: line,
                    });
                }
            });
        });

        return acc;
    }, [])};

});
