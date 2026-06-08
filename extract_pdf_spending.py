import pdfplumber
import json
import sys

def extract_spending_from_pdf(pdf_path):
    """Extract spending breakdown by standard object from Departmental Plan PDF"""
    spending_data = {}
    
    with pdfplumber.open(pdf_path) as pdf:
        print(f"PDF has {len(pdf.pages)} pages")
        
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                # Look for spending-related keywords
                keywords = ["spending", "expenditure", "personnel", "professional", "transportation", "capital", "standard"]
                if any(keyword in text.lower() for keyword in keywords):
                    try:
                        print(f"\n=== Page {i+1} ===")
                        print(text[:800])  # Print first 800 chars
                    except UnicodeEncodeError:
                        print(f"\n=== Page {i+1} === (encoding error, skipping text)")
                    
                    # Extract tables
                    tables = page.extract_tables()
                    if tables:
                        print(f"\nFound {len(tables)} table(s) on page {i+1}")
                        for j, table in enumerate(tables):
                            print(f"\nTable {j+1} has {len(table)} rows")
                            for row in table[:10]:  # Print first 10 rows
                                try:
                                    print(row)
                                except UnicodeEncodeError:
                                    print("(encoding error in row)")
    
    return spending_data

if __name__ == "__main__":
    # Set UTF-8 encoding for stdout
    sys.stdout.reconfigure(encoding='utf-8')
    
    pdf_path = "dnd-departmental-plan-2024-25.pdf"
    spending_data = extract_spending_from_pdf(pdf_path)
    
    print("\nExtracted spending data:")
    print(json.dumps(spending_data, indent=2))
