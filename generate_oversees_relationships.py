import json

# Load entities and relationships
with open('data/entities.json', 'r') as f:
    entities = json.load(f)

with open('data/relationships.json', 'r') as f:
    relationships = json.load(f)

# Create a set of existing oversees relationships to avoid duplicates
existing_oversees = set()
for rel in relationships:
    if rel['type'] == 'oversees':
        existing_oversees.add((rel['from'], rel['to']))

# Generate oversees relationships from parent field
new_oversees = []
for entity in entities:
    if entity.get('parent') and entity['parent'] != entity['id']:
        # Create oversees relationship from child to parent
        key = (entity['id'], entity['parent'])
        if key not in existing_oversees:
            new_oversees.append({
                'from': entity['id'],
                'to': entity['parent'],
                'type': 'oversees'
            })
            existing_oversees.add(key)

# Add new oversees relationships to the existing ones
relationships.extend(new_oversees)

# Save updated relationships
with open('data/relationships.json', 'w') as f:
    json.dump(relationships, f, indent=2)

print(f"Added {len(new_oversees)} new oversees relationships")
print(f"Total oversees relationships: {len([r for r in relationships if r['type'] == 'oversees'])}")
