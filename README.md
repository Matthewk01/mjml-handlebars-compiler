# MJML + Handlebars compiler tool

- This tool compiles MJML templates with Handlebars data and outputs HTML files
- Supports multiple templates and multiple data files
- Supports hot reload
- TODO: Better custom helpers support

## Usage

- `npm install`
- Put your templates with data in `templates` folder in following format:
```
TEMPLATE_NAME.mjml
TEMPLATE_NAME.json
```
- Example: `templates/welcome.mjml`, `templates/welcome.json`
- `npm run start:dev`