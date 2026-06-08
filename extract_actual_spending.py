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

# Map organization names in CSV to entity IDs
org_mapping = {
    "Department of National Defence": "national-defence",
    "Department of Health": "health",
    "Treasury Board Secretariat": "treasury-board",
    "Department of Finance": "finance",
    "Department of Employment and Social Development": "esdc"
}

spending_breakdown = {}

# Try different encodings
encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
f = None

for encoding in encodings:
    try:
        f = open('budgetary-expenditures-standard-object.csv', 'r', encoding=encoding)
        # Test if we can read the first line
        f.readline()
        f.seek(0)
        print(f"Using encoding: {encoding}")
        break
    except UnicodeDecodeError:
        if f:
            f.close()
        f = None
        continue

if not f:
    raise Exception("Could not read CSV with any of the attempted encodings")

# Read line by line to handle the structure
lines = f.readlines()
f.close()

# Find the header row (starts with "Organization")
header_line = None
for i, line in enumerate(lines):
    if 'Organization' in line:
        header_line = i
        break

if header_line is None:
    raise Exception("Could not find header row")

print(f"Header found at line {header_line}")

# Skip the header row and the next row (which has column numbers)
data_start = header_line + 2

print(f"Data starts at line {data_start}")
print(f"First few organizations:")

# Parse the CSV data manually
for i in range(data_start, min(data_start + 5, len(lines))):
    line = lines[i].strip()
    if line:
        parts = line.split(',')
        if parts:
            org_name = parts[0].strip('"')
            print(f"  '{org_name}'")

# Now process all data rows
for i in range(data_start, len(lines)):
    line = lines[i].strip()
    if not line:
        continue
    
    # Parse the CSV line
    reader = csv.reader([line])
    row = next(reader)
    
    if len(row) < 15:
        continue
    
    org_name = row[0].strip('"')
    
    if org_name in org_mapping:
        entity_id = org_mapping[org_name]
        
        # Parse spending categories using column indices
        # Based on the CSV structure: Organization, Personnel, Transportation, Information, Professional, Rentals, Maintenance, Utilities, Land, Machinery, Transfer, Public debt, Other, Revenues, Total
        total = parse_currency(row[14]) if len(row) > 14 else 0
        
        if total > 0:
            breakdown = {
                'personnel': parse_currency(row[1]) if len(row) > 1 else 0,
                'transportation': parse_currency(row[2]) if len(row) > 2 else 0,
                'information': parse_currency(row[3]) if len(row) > 3 else 0,
                'professional_services': parse_currency(row[4]) if len(row) > 4 else 0,
                'rentals': parse_currency(row[5]) if len(row) > 5 else 0,
                'maintenance': parse_currency(row[6]) if len(row) > 6 else 0,
                'utilities': parse_currency(row[7]) if len(row) > 7 else 0,
                'land_buildings': parse_currency(row[8]) if len(row) > 8 else 0,
                'machinery': parse_currency(row[9]) if len(row) > 9 else 0,
                'transfer_payments': parse_currency(row[10]) if len(row) > 10 else 0,
                'public_debt': parse_currency(row[11]) if len(row) > 11 else 0,
                'other_subsidies': parse_currency(row[12]) if len(row) > 12 else 0,
                'revenues': parse_currency(row[13]) if len(row) > 13 else 0,
                'total': total
            }
            
            # Calculate percentages (excluding revenues as it's a reduction)
            net_total = total - breakdown['revenues']
            if net_total > 0:
                breakdown['percentages'] = {
                    'personnel': breakdown['personnel'] / net_total,
                    'transportation': breakdown['transportation'] / net_total,
                    'information': breakdown['information'] / net_total,
                    'professional_services': breakdown['professional_services'] / net_total,
                    'rentals': breakdown['rentals'] / net_total,
                    'maintenance': breakdown['maintenance'] / net_total,
                    'utilities': breakdown['utilities'] / net_total,
                    'capital': (breakdown['land_buildings'] + breakdown['machinery']) / net_total,
                    'transfer_payments': breakdown['transfer_payments'] / net_total
                }
            
            spending_breakdown[entity_id] = breakdown

print("Extracted spending breakdown:")
for entity_id, data in spending_breakdown.items():
    print(f"\n{entity_id}:")
    print(f"  Total: ${data['total']:,.0f}")
    print(f"  Net Total: ${data['total'] - data['revenues']:,.0f}")
    print(f"  Percentages:")
    for category, percentage in data['percentages'].items():
        print(f"    {category}: {percentage * 100:.1f}%")

# Save to JSON
with open('actual_spending_breakdown.json', 'w', encoding='utf-8') as f:
    json.dump(spending_breakdown, f, indent=2)

print("\nSaved to actual_spending_breakdown.json")
