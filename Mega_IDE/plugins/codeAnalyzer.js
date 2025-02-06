/**
 * Code Analyzer Plugin
 * 
 * A sample plugin that provides code analysis functionality
 */

class CodeAnalyzerPlugin {
  constructor() {
    this.name = 'CodeAnalyzer';
    this.version = '1.0.0';
  }

  analyze(code) {
    const metrics = {
      lines: code.split('\n').length,
      characters: code.length,
      functions: (code.match(/function/g) || []).length,
      classes: (code.match(/class\s+\w+/g) || []).length,
      comments: (code.match(/\/\/.*/g) || []).length + (code.match(/\/\*[\s\S]*?\*\//g) || []).length
    };

    return {
      metrics,
      summary: `Code Analysis:
        - ${metrics.lines} lines of code
        - ${metrics.functions} functions
        - ${metrics.classes} classes
        - ${metrics.comments} comments
        - ${metrics.characters} total characters`
    };
  }

  // Plugin interface methods
  activate() {
    console.log('CodeAnalyzer plugin activated');
    return true;
  }

  deactivate() {
    console.log('CodeAnalyzer plugin deactivated');
    return true;
  }

  getCommands() {
    return {
      'analyze': this.analyze.bind(this)
    };
  }
}

module.exports = new CodeAnalyzerPlugin();
