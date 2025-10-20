#!/usr/bin/env python3
"""
Format changelog input for proper markdown formatting.
This handles the conversion from single-line GitHub input to properly formatted markdown.
"""

import sys
import re

def format_changelog(input_text):
    """Format changelog text with proper markdown structure."""
    
    # Convert escaped newlines to actual newlines
    text = input_text.replace('\\n', '\n').replace('\\1', '\n')
    
    # Trim whitespace
    text = text.strip()
    
    # Fix section headers that appear mid-text - add newlines before them
    # Example: "text ### Added" -> "text\n\n### Added"
    text = re.sub(r'([^\n]) (### [A-Za-z]+)', r'\1\n\n\2', text)
    
    # Fix section headers - ensure they have proper newlines after the section name
    # Example: "### Added - item" -> "### Added\n- item"
    text = re.sub(r'^(### [A-Za-z]+) - ', r'\1\n- ', text, flags=re.MULTILINE)
    
    # Fix bullet points that are inline with text
    # Example: "text - item" -> "text\n- item"
    text = re.sub(r'([^\n]) - ', r'\1\n- ', text)
    
    # Ensure section headers have blank line after them if followed by content
    text = re.sub(r'(^### [A-Za-z]+)\n([^-\n])', r'\1\n\n\2', text, flags=re.MULTILINE)
    
    # Clean up multiple newlines (max 2 consecutive)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: format-changelog.py <changelog_input>", file=sys.stderr)
        sys.exit(1)
    
    input_text = ' '.join(sys.argv[1:])
    formatted = format_changelog(input_text)
    print(formatted)

