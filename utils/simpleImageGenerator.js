import fs from "fs";

class SimpleImageGenerator {
  constructor() {
    this.width = 1200;
    this.height = 630;
  }

  // Generate a simple HTML template for social media preview
  generateQuestionPreviewHTML(question) {
    const difficultyColors = {
      Easy: "#10b981",
      Medium: "#f59e0b",
      Hard: "#ef4444",
    };

    const badgeColor = difficultyColors[question.difficulty] || "#6b7280";

    // Truncate answer for preview
    const answerPreview =
      question.answer.length > 150
        ? question.answer.substring(0, 150) + "..."
        : question.answer;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${question.question}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            width: ${this.width}px;
            height: ${this.height}px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            position: relative;
            overflow: hidden;
            color: white;
        }
        
        .container {
            padding: 60px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        
        .header {
            text-align: left;
        }
        
        .logo {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 10px;
            color: white;
        }
        
        .tagline {
            font-size: 24px;
            color: #94a3b8;
        }
        
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            max-width: 100%;
        }
        
        .question-header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .difficulty-badge {
            background-color: ${badgeColor};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 16px;
            font-weight: bold;
            margin-right: 20px;
            display: inline-block;
        }
        
        .category {
            color: #94a3b8;
            font-size: 18px;
        }
        
        .question {
            color: white;
            font-size: 32px;
            font-weight: bold;
            line-height: 1.3;
            margin-bottom: 20px;
            max-width: 100%;
            word-wrap: break-word;
        }
        
        .answer {
            color: #94a3b8;
            font-size: 20px;
            line-height: 1.5;
            max-width: 100%;
            word-wrap: break-word;
        }
        
        .footer {
            text-align: center;
            color: #64748b;
            font-size: 18px;
            border-top: 2px solid #334155;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CodeIntervu</div>
            <div class="tagline">Code. Practice. Conquer.</div>
        </div>
        
        <div class="content">
            <div class="question-header">
                <div class="difficulty-badge">${question.difficulty}</div>
                <div class="category">${
                  question.categoryName || question.category
                }</div>
            </div>
            
            <div class="question">${question.question}</div>
            
            <div class="answer">${answerPreview}</div>
        </div>
        
        <div class="footer">
            Learn Programming & Crack Coding Interviews
        </div>
    </div>
</body>
</html>`;
  }

  // Generate preview HTML
  async generateQuestionPreview(question) {
    try {
      const html = this.generateQuestionPreviewHTML(question);

      return {
        html: html,
        width: this.width,
        height: this.height,
        format: "html",
      };
    } catch (error) {
      console.error("Error generating preview HTML:", error);
      throw error;
    }
  }

  // Save HTML to file
  async generateAndSaveQuestionPreview(question, outputPath) {
    try {
      const result = await this.generateQuestionPreview(question);
      fs.writeFileSync(outputPath, result.html);
      return outputPath;
    } catch (error) {
      console.error("Error generating preview HTML:", error);
      throw error;
    }
  }

  // Generate preview HTML and return as base64
  async generateQuestionPreviewBase64(question) {
    try {
      const result = await this.generateQuestionPreview(question);
      return Buffer.from(result.html).toString("base64");
    } catch (error) {
      console.error("Error generating preview HTML:", error);
      throw error;
    }
  }
}

export default SimpleImageGenerator;
