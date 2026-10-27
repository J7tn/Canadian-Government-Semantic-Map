import csv
import json

def parse_currency(value):
    """Parse currency string to float"""
    if not value:
        return 0
    try:
        return float(value.replace(',', '').replace('$', '').strip())
    except ValueError:
        return 0

# Read the Main Estimates CSV and extract spending breakdown by organization
spending_breakdown = {}

# Try different encodings
encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
f = None
reader = None

for encoding in encodings:
    try:
        f = open('budgetary-expenditures-standard-object.csv', 'r', encoding=encoding)
        reader = csv.DictReader(f)
        # Test if we can read the first row
        next(reader)
        f.seek(0)
        reader = csv.DictReader(f)
        print(f"Using encoding: {encoding}")
        break
    except (UnicodeDecodeError, StopIteration):
        if f:
            f.close()
        f = None
        reader = None
        continue

if not reader:
    raise Exception("Could not read CSV with any of the attempted encodings")

for row in reader:
    org_name = row.get('Organization', '').strip()
    
    if not org_name or org_name.startswith('2024') or org_name.startswith('Budgetary') or org_name.startswith('This table') or org_name.startswith('Definitions') or org_name.startswith('Interest') or org_name.startswith('Table') or org_name.startswith('Organization'):
        continue
    
    # Parse spending categories
    breakdown = {
        'personnel': parse_currency(row.get('Personnel', '0')),
        'transportation': parse_currency(row.get('Transportation and communications', '0')),
        'information': parse_currency(row.get('Information', '0')),
        'professional_services': parse_currency(row.get('Professional and special services', '0')),
        'rentals': parse_currency(row.get('Rentals', '0')),
        'maintenance': parse_currency(row.get('Purchased repair and maintenance', '0')),
        'utilities': parse_currency(row.get('Utilities, materials and supplies', '0')),
        'land_buildings': parse_currency(row.get('Acquisition of land, buildings and works', '0')),
        'machinery': parse_currency(row.get('Acquisition of machinery and equipment', '0')),
        'transfer_payments': parse_currency(row.get('Transfer payments', '0')),
        'public_debt': parse_currency(row.get('Public debt charges', '0')),
        'other_subsidies': parse_currency(row.get('Other subsidies and payments', '0')),
        'revenues': parse_currency(row.get('Less: Revenues and other reductions', '0')),
        'total': parse_currency(row.get('Total', '0'))
    }
    
    spending_breakdown[org_name] = breakdown

f.close()

# Print sample
print(f"Total organizations with spending breakdown: {len(spending_breakdown)}")
print("\nSample breakdown for Canada Revenue Agency:")
if 'Canada Revenue Agency' in spending_breakdown:
    for key, value in spending_breakdown['Canada Revenue Agency'].items():
        print(f"  {key}: ${value:,.0f}")

# Save to JSON
with open('spending_breakdown.json', 'w', encoding='utf-8') as f:
    json.dump(spending_breakdown, f, indent=2)

print("\nSaved to spending_breakdown.json")
