import fs from "fs";
import handlebars from "handlebars";
import mjml2html from "mjml";
import { basename, join, resolve } from "path";

const INPUT_DIR = "templates";
const OUTPUT_DIR = "out";

const getUniqueTemplatePathsWithoutExtensions = () => {
  const templates = fs.readdirSync(INPUT_DIR);
  const templatesFiles = templates
    .filter((template) => !template.includes(".mjml"))
    .map((template) => `${INPUT_DIR}/${template}/${template}`);
  return templatesFiles.map((template) => resolve(`${template}`));
};

const compileHandlebars = async (templatePaths: string[]) => {
  const mjmlWithoutHendlebars: string[][] = [];
  for (const templatePath of templatePaths) {
    const templateMjmlPath = `${templatePath}.mjml`;
    const templateJsonPath = `${templatePath}.json`;
    const mjmlFileExist = fs.existsSync(templateMjmlPath);
    const jsonFileExist = fs.existsSync(templateJsonPath);
    if (!jsonFileExist || !mjmlFileExist) {
      if (!jsonFileExist)
        console.error("Error: JSON file not exist in folder " + templatePath);
      if (!mjmlFileExist)
        console.error("Error: MJML file not exist in folder " + templatePath);
      continue;
    }

    if (fs.readFileSync(templateJsonPath, "utf8") === "") {
      console.error("Error: JSON file is empty in folder " + templatePath);
      continue;
    }
    if (fs.readFileSync(templateMjmlPath, "utf8") === "") {
      console.error("Error: MJML file is empty in folder " + templatePath);
      continue;
    }
    const templateBlob = fs.readFileSync(join(templateMjmlPath), "utf8");

    const templateData = JSON.parse(
      fs.readFileSync(join(templateJsonPath), "utf8")
    );
    handlebars.registerHelper("length", function (array: any) {
      return array.length;
    });
    handlebars.registerHelper(
      "greaterThan",
      function (a: any, b: any, options: any) {
        if (a > b) {
          // @ts-ignore
          return options.fn(this);
        } else {
          // @ts-ignore
          return options.inverse(this);
        }
      }
    );
    handlebars.registerHelper(
      "equals",
      function (a: any, b: any, options: any) {
        if (a === b) {
          // @ts-ignore
          return options.fn(this);
        } else {
          // @ts-ignore
          return options.inverse(this);
        }
      }
    );
    const { html } = mjml2html(templateBlob, {
      filePath: join(INPUT_DIR),
    });
    const templateCompiled = handlebars.compile(html)(templateData);
    mjmlWithoutHendlebars.push([templatePath, templateCompiled]);
    handlebars.unregisterHelper("include");
  }
  return mjmlWithoutHendlebars;
};

const main = () => {
  const templates = getUniqueTemplatePathsWithoutExtensions();
  compileHandlebars(templates).then((mjmlBlobs) => {
    mjmlBlobs.forEach((mjmlBlob) => {
      const [templatePath, templateCompiled] = mjmlBlob;
      const templateName = basename(`${templatePath}`, ".mjml");
      const fileName = `${templateName}.html`;
      fs.writeFileSync(`${OUTPUT_DIR}/${fileName}`, templateCompiled, "utf8");
    });
  });
};

main();
