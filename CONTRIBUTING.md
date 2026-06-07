# Contributing to Canadian Government Semantic Map

Thank you for your interest in contributing to the Canadian Government Semantic Map!

## How to Contribute

### Adding or Updating Entities

1. Edit `data/entities.json` to add new entities or update existing ones
2. Ensure all required fields are present:
   - `id`: Unique identifier (use kebab-case)
   - `name`: Official name of the entity
   - `type`: One of: Ministry, Agency, CrownCorporation, Program, Other
   - `parent`: ID of parent entity or null
   - `budget`: Annual budget in CAD (or null if not available)
   - `description`: Brief description of the entity's purpose
   - `source`: URL to official government source
   - `lastUpdated`: Date in YYYY-MM-DD format

3. Update `data/relationships.json` to add new relationships if needed

### Adding Relationships

1. Edit `data/relationships.json`
2. Use existing entity IDs for `from` and `to` fields
3. Choose appropriate relationship type:
   - `reports_to`: Hierarchical reporting relationship
   - `funds`: Budget allocation relationship
   - `regulates`: Regulatory oversight
   - `owns`: Ownership relationship
   - `oversees`: General oversight

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow existing code style
- Use descriptive variable and function names
- Add comments for complex logic
- Ensure the application builds successfully before submitting

## Data Guidelines

- **Accuracy**: All data must be from official government sources
- **Neutrality**: Descriptions should be factual and non-partisan
- **Sources**: Always include a source URL for each entity
- **Currency**: Update the `lastUpdated` field when modifying data

## Privacy and Anonymity

- Do not include personal information in commits
- Use pseudonyms for contributions if desired
- No user data is collected or stored

## Testing

Before submitting changes:

1. Run `npm run dev` to ensure the application starts
2. Test new entities appear in the graph
3. Verify relationships display correctly
4. Check that search and filters work with new data

## Questions or Issues?

If you have questions or encounter issues, please open an issue on GitHub.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
